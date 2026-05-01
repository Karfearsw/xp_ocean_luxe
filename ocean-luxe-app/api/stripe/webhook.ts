import { bookingConfirmationEmail } from "../_lib/email-templates/booking-confirmation";
import { paymentFailedEmail } from "../_lib/email-templates/payment-failed";
import { buildCrmPayload } from "../_lib/crm-sync";
import { getResend } from "../_lib/resend";
import { getStripe } from "../_lib/stripe";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

async function sendEmail(to: string, content: { subject: string; html: string }) {
  const resend = getResend();
  if (!resend || !process.env.RESEND_FROM_EMAIL) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject: content.subject,
    html: content.html,
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  if (!stripe || !supabase) {
    res.status(200).json({ received: true, mode: "fallback" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ message: "Missing webhook signature configuration" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid webhook" });
    return;
  }

  const { error: duplicateError } = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
    processed_at: new Date().toISOString(),
  });

  if (duplicateError && !duplicateError.message.includes("duplicate")) {
    res.status(500).json({ message: duplicateError.message });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const bookingId = intent.metadata.bookingId;
    const { data: booking } = await supabase
      .from("bookings")
      .update({ payment_status: "paid", booking_status: "confirmed", stripe_payment_intent_id: intent.id, crm_sync_status: "pending", email_status: "sent" })
      .eq("id", bookingId)
      .select()
      .single();

    if (booking) {
      const crmPayload = buildCrmPayload(booking);
      await supabase.from("crm_sync_queue").insert([
        { booking_id: booking.id, destination: "crm_rest", payload: crmPayload },
        { booking_id: booking.id, destination: "discord", payload: crmPayload },
      ]);

      await sendEmail(booking.guest_email, bookingConfirmationEmail(booking.id, booking.guest_name));
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const bookingId = intent.metadata.bookingId;
    const { data: booking } = await supabase
      .from("bookings")
      .update({ payment_status: "failed", booking_status: "pending_payment", email_status: "failed" })
      .eq("id", bookingId)
      .select()
      .single();

    if (booking) {
      await sendEmail(booking.guest_email, paymentFailedEmail(booking.id));
    }
  }

  res.status(200).json({ received: true });
}
