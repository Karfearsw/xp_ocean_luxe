import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { getStripe } from "../_lib/stripe.js";
import { fallbackPackages } from "../_lib/sample-data.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { withErrorHandling } from "../_lib/handler.js";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

async function handler(req: ApiRequest, res: ApiResponse) {
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
    const guestCertificateFee = samplePackage.guest_certificate_fee ?? 0;
    const amount = samplePackage.payment_mode === "deposit"
      ? (samplePackage.deposit_amount ?? 0) + guestCertificateFee
      : samplePackage.public_price + guestCertificateFee;
    res.status(200).json({
      clientSecret: `test_secret_${bookingId}`,
      amount,
      paymentMode: samplePackage.payment_mode,
    });
    return;
  }

  const booking = await db.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  const holdTtlMinutes = Number.isFinite(Number(process.env.AVAILABILITY_HOLD_TTL_MINUTES))
    ? Number(process.env.AVAILABILITY_HOLD_TTL_MINUTES)
    : 30;
  const holdExpiresAt = new Date(Date.now() + holdTtlMinutes * 60 * 1000).toISOString();

  const availabilityBlockId = typeof (booking as Record<string, unknown>).availability_block_id === "string"
    ? ((booking as Record<string, unknown>).availability_block_id as string)
    : null;
  if (availabilityBlockId) {
    const block = await db.getAvailabilityBlockById(availabilityBlockId);
    const status = typeof block?.status === "string" ? block.status : null;
    const expiresAt = typeof block?.hold_expires_at === "string" ? Date.parse(block.hold_expires_at) : null;
    const isExpired = expiresAt != null && Number.isFinite(expiresAt) && expiresAt <= Date.now();
    if (status !== "held" || isExpired) {
      res.status(409).json({ message: "Availability hold expired. Please restart your booking." });
      return;
    }
    await db.extendAvailabilityHold(availabilityBlockId, holdExpiresAt);
  }

  const packageDetails = await db.getPackagePricing(booking.package_id);
  if (!packageDetails) {
    res.status(404).json({ message: "Package pricing not found" });
    return;
  }

  const storedDueNow = asNumber((booking as Record<string, unknown>).due_now);
  const storedDeposit = asNumber(booking.deposit_amount);
  const storedTotal = asNumber(booking.total_price);
  const storedBalance = asNumber(booking.balance_due);

  const guestCertificateFee = asNumber(packageDetails.guest_certificate_fee) ?? 0;
  const publicPrice = asNumber(packageDetails.public_price) ?? 0;
  const packageDeposit = asNumber(packageDetails.deposit_amount) ?? 0;
  const storedCarTotal = asNumber((booking as Record<string, unknown>).car_total);
  const storedConciergeTotal = asNumber((booking as Record<string, unknown>).concierge_total);
  const conciergeServicesBaseTotal = asNumber((booking as Record<string, unknown>).concierge_services_base_total);

  const carTotal = storedCarTotal ?? 0;
  const conciergeTotal = storedConciergeTotal != null && storedConciergeTotal > 0
    ? storedConciergeTotal
    : conciergeServicesBaseTotal ?? 0;
  const addonsTotal = carTotal + conciergeTotal;

  const totalPrice = roundCurrency(publicPrice + guestCertificateFee + addonsTotal);
  const depositAmount = packageDetails.payment_mode === "deposit" ? packageDeposit : totalPrice;
  const dueNow = packageDetails.payment_mode === "deposit"
    ? roundCurrency(depositAmount + guestCertificateFee + addonsTotal)
    : totalPrice;
  const balanceDue = roundCurrency(Math.max(0, totalPrice - dueNow));

  const amount = storedDueNow ?? dueNow;
  if (storedTotal == null || storedBalance == null || storedDeposit == null || storedDueNow == null) {
    const patch: Record<string, string | number | boolean | null> = {};
    if (storedTotal == null) patch.total_price = totalPrice;
    if (storedDeposit == null) patch.deposit_amount = depositAmount;
    if (storedDueNow == null) patch.due_now = dueNow;
    if (storedBalance == null) patch.balance_due = balanceDue;

    const paymentStatus = typeof booking.payment_status === "string" ? booking.payment_status : null;
    const bookingStatus = typeof booking.booking_status === "string" ? booking.booking_status : null;
    if (paymentStatus !== "paid" && paymentStatus !== "refunded") patch.payment_status = "pending";
    if (bookingStatus !== "confirmed" && bookingStatus !== "cancelled" && bookingStatus !== "refunded") {
      patch.booking_status = "pending_payment";
    }

    await db.markBooking(booking.id, patch);
  }

  const stripe = getStripe();
  if (!stripe) {
    res.status(200).json({ clientSecret: `test_secret_${bookingId}`, amount, paymentMode: packageDetails.payment_mode });
    return;
  }

  const currency = booking.currency?.toLowerCase() ?? "usd";
  const amountCents = Math.round(amount * 100);
  const existingIntentId = typeof booking.stripe_payment_intent_id === "string" ? booking.stripe_payment_intent_id : null;

  const effectiveDueNow = storedDueNow ?? dueNow;
  const effectiveTotalPrice = storedTotal ?? totalPrice;
  const effectiveBalanceDue = storedBalance ?? balanceDue;

  const baseMetadata: Record<string, string> = {
    booking_id: booking.id,
    package_id: booking.package_id,
    resort_id: booking.resort_id,
    payment_mode: packageDetails.payment_mode,
    due_now: String(effectiveDueNow),
    total_price: String(effectiveTotalPrice),
    balance_due: String(effectiveBalanceDue),
  };

  const customerId = (booking as Record<string, unknown>).customer_id;
  if (typeof customerId === "string") {
    baseMetadata.customer_id = customerId;
  }

  let intent = null as Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>> | null;
  if (existingIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(existingIntentId);
      if (
        existing &&
        typeof existing.amount === "number" &&
        existing.amount === amountCents &&
        existing.currency === currency &&
        existing.status !== "canceled" &&
        typeof existing.client_secret === "string"
      ) {
        intent = existing;
      }
    } catch {
      intent = null;
    }
  }

  if (!intent) {
    intent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: baseMetadata,
        receipt_email: booking.guest_email,
        description: `Ocean Luxe booking ${booking.id}`,
      },
      {
        idempotencyKey: `booking:${booking.id}:due_now:${amountCents}:${currency}`,
      }
    );
  }

  if (!intent.client_secret) {
    res.status(500).json({ message: "Unable to create payment intent client secret." });
    return;
  }

  await Promise.all([
    db.markBooking(booking.id, {
      stripe_payment_intent_id: intent.id,
      payment_status: "pending",
      booking_status: "pending_payment",
    }),
    db.upsertPayment({
      booking_id: booking.id,
      stripe_payment_intent_id: intent.id,
      amount,
      status: "pending",
      paid_at: null,
    }),
  ]);

  res.status(200).json({ clientSecret: intent.client_secret, amount, paymentMode: packageDetails.payment_mode });
}

export default withErrorHandling(handler);
