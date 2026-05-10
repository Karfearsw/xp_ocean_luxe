import type { ApiRequest, ApiResponse } from "../_lib/http";
import { getStripe } from "../_lib/stripe";
import { fallbackPackages } from "../_lib/sample-data";
import { getDbAdapter } from "../_lib/db-adapter";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const bookingId =
    req.body && typeof req.body === "object" && "bookingId" in req.body && typeof req.body.bookingId === "string"
      ? req.body.bookingId
      : undefined;
  if (!bookingId) {
    res.status(400).json({ message: "Missing booking ID" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    const samplePackage = fallbackPackages[0];
    res.status(200).json({
      clientSecret: `test_secret_${bookingId}`,
      amount: samplePackage.deposit_amount ?? samplePackage.public_price,
      paymentMode: samplePackage.payment_mode,
    });
    return;
  }

  const booking = await db.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  const packageDetails = await db.getPackagePricing(booking.package_id);
  if (!packageDetails) {
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

  await db.markBooking(booking.id, { stripe_payment_intent_id: intent.id });

  res.status(200).json({ clientSecret: intent.client_secret, amount, paymentMode: packageDetails.payment_mode });
}
