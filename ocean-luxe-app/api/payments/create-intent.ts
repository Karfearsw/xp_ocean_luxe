import { getStripe } from "../_lib/stripe";
import { getSupabaseAdmin } from "../_lib/supabase-admin";
import { fallbackPackages } from "../_lib/sample-data";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const bookingId = req.body?.bookingId;
  if (!bookingId) {
    res.status(400).json({ message: "Missing booking ID" });
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const samplePackage = fallbackPackages[0];
    res.status(200).json({
      clientSecret: `test_secret_${bookingId}`,
      amount: samplePackage.deposit_amount ?? samplePackage.public_price,
      paymentMode: samplePackage.payment_mode,
    });
    return;
  }

  const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (bookingError || !booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  const { data: packageDetails, error: packageError } = await supabase.from("packages").select("payment_mode, deposit_amount, public_price").eq("id", booking.package_id).single();
  if (packageError || !packageDetails) {
    res.status(404).json({ message: "Package pricing not found" });
    return;
  }

  const amount = packageDetails.payment_mode === "deposit"
    ? packageDetails.deposit_amount ?? 0
    : packageDetails.public_price;

  const stripe = getStripe();
  if (!stripe) {
    res.status(200).json({ clientSecret: `test_secret_${bookingId}`, amount, paymentMode: packageDetails.payment_mode });
    return;
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: booking.currency?.toLowerCase() ?? "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      bookingId: booking.id,
      packageId: booking.package_id,
      resortId: booking.resort_id,
    },
    receipt_email: booking.guest_email,
  });

  await supabase.from("bookings").update({ stripe_payment_intent_id: intent.id }).eq("id", booking.id);

  res.status(200).json({ clientSecret: intent.client_secret, amount, paymentMode: packageDetails.payment_mode });
}
