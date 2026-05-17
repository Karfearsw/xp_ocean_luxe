import { bookingConfirmationEmail } from "../_lib/email-templates/booking-confirmation.js";
import { paymentFailedEmail } from "../_lib/email-templates/payment-failed.js";
import { buildCrmPayload } from "../_lib/crm-sync.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { getResend } from "../_lib/resend.js";
import { getStripe } from "../_lib/stripe.js";
import { withErrorHandling } from "../_lib/handler.js";

function getRawBody(body: unknown) {
  if (typeof body === "string" || body instanceof Buffer) {
    return body;
  }

  if (body && typeof body === "object") {
    return JSON.stringify(body);
  }

  return "";
}

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

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const stripe = getStripe();
  const db = getDbAdapter();
  if (!stripe || !db) {
    res.status(200).json({ received: true, mode: "fallback" });
    return;
  }

  const signature = Array.isArray(req.headers["stripe-signature"])
    ? req.headers["stripe-signature"][0]
    : req.headers["stripe-signature"];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ message: "Missing webhook signature configuration" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(getRawBody(req.body), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid webhook" });
    return;
  }

  const duplicateError = await db.insertStripeWebhookEvent({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
    processed_at: new Date().toISOString(),
  });

  if (duplicateError && duplicateError !== "duplicate") {
    res.status(500).json({ message: duplicateError });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const bookingId = intent.metadata.bookingId;
    const paidAmount = typeof intent.amount_received === "number" && intent.amount_received > 0
      ? intent.amount_received / 100
      : intent.amount / 100;

    await db.upsertPayment({
      booking_id: bookingId,
      stripe_payment_intent_id: intent.id,
      amount: paidAmount,
      status: "succeeded",
      paid_at: new Date().toISOString(),
    });
    const booking = await db.markBooking(bookingId, {
      payment_status: "paid",
      booking_status: "confirmed",
      stripe_payment_intent_id: intent.id,
      crm_sync_status: "pending",
      email_status: "sent",
    });

    if (booking) {
      const crmPayload = buildCrmPayload({ ...booking, event_type: "booking_paid" });
      await db.enqueueCrmJobs([
        { booking_id: booking.id, destination: "crm_rest", payload: crmPayload },
        { booking_id: booking.id, destination: "discord", payload: crmPayload },
      ]);

      await sendEmail(booking.guest_email, bookingConfirmationEmail(booking.id, booking.guest_name));
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const bookingId = intent.metadata.bookingId;
    await db.upsertPayment({
      booking_id: bookingId,
      stripe_payment_intent_id: intent.id,
      amount: intent.amount / 100,
      status: "failed",
      paid_at: null,
    });
    const booking = await db.markBooking(bookingId, {
      payment_status: "failed",
      booking_status: "pending_payment",
      email_status: "failed",
    });

    if (booking) {
      const crmPayload = buildCrmPayload({ ...booking, event_type: "booking_payment_failed" });
      await db.enqueueCrmJobs([
        { booking_id: booking.id, destination: "crm_rest", payload: crmPayload },
      ]);
      await sendEmail(booking.guest_email, paymentFailedEmail(booking.id));
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const bookingId = charge.metadata?.bookingId;
    if (bookingId) {
      const chargeMeta = charge as unknown as { payment_intent?: unknown };
      const intentId = typeof chargeMeta.payment_intent === "string" ? chargeMeta.payment_intent : null;
      await db.upsertPayment({
        booking_id: bookingId,
        stripe_payment_intent_id: intentId,
        amount: (charge.amount_refunded ?? charge.amount ?? 0) / 100,
        status: "refunded",
        paid_at: new Date().toISOString(),
      });
      const booking = await db.markBooking(bookingId, {
        payment_status: "refunded",
        booking_status: "refunded",
        crm_sync_status: "pending",
      });
      if (booking) {
        const crmPayload = buildCrmPayload({ ...booking, event_type: "booking_refunded" });
        await db.enqueueCrmJobs([
          { booking_id: booking.id, destination: "crm_rest", payload: crmPayload },
        ]);
      }
    }
  }

  res.status(200).json({ received: true });
}

export default withErrorHandling(handler);
