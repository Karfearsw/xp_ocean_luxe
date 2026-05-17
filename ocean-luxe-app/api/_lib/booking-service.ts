import { bookingDraftSchema } from "../../../shared/contracts/bookings";
import type { ApiResponse } from "./http.js";
import { fallbackPackages, fallbackResorts } from "./sample-data.js";
import { getDbAdapter } from "./db-adapter.js";

function jsonResponse(res: ApiResponse, status: number, payload: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

export async function createBookingDraftRecord(res: ApiResponse, body: unknown) {
  const parsed = bookingDraftSchema.safeParse(body);
  if ("error" in parsed) {
    return jsonResponse(res, 400, { message: parsed.error.flatten() });
  }

  const db = getDbAdapter();
  const payload = parsed.data;
  const age = Math.floor((Date.now() - Date.parse(payload.guest_dob)) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 21) {
    return jsonResponse(res, 400, { message: "Primary guest must be at least 21 years old at booking time." });
  }

  if (!db) {
    const packageDetails = fallbackPackages.find((entry) => entry.id === payload.package_id);
    const bookingId = crypto.randomUUID();
    const guestCertificateFee = packageDetails?.guest_certificate_fee ?? 0;
    const totalPrice = (packageDetails?.public_price ?? 0) + guestCertificateFee;
    const depositAmount = packageDetails?.payment_mode === "deposit"
      ? (packageDetails?.deposit_amount ?? 0) + guestCertificateFee
      : totalPrice;
    const baseCost = (packageDetails?.base_cost ?? 0) + guestCertificateFee;
    return jsonResponse(res, 200, {
      id: bookingId,
      ...payload,
      selected_dates: { check_in_date: payload.check_in_date, check_out_date: payload.check_out_date },
      customer_price: totalPrice,
      base_cost: baseCost,
      margin: totalPrice - baseCost,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      balance_due: Math.max(0, totalPrice - depositAmount),
      payment_status: "pending",
      booking_status: "pending_payment",
      stripe_payment_intent_id: null,
      provider_confirmation_number: null,
      created_at: new Date().toISOString(),
    });
  }

  const packageDetails = await db.getActivePackageById(payload.package_id);
  if (!packageDetails) {
    return jsonResponse(res, 404, { message: "Package unavailable." });
  }

  if (payload.resort_id !== packageDetails.resort_id) {
    return jsonResponse(res, 400, { message: "Selected resort/package mismatch." });
  }

  if (payload.room_type_id) {
    const isValidRoom = await db.isRoomTypeForResort(payload.room_type_id, packageDetails.resort_id);
    if (!isValidRoom) {
      return jsonResponse(res, 400, { message: "Selected room type is unavailable." });
    }
  }

  const availabilityCheck = await db.lockAvailability(payload.package_id, payload.check_in_date, payload.check_out_date);
  if (availabilityCheck !== true) {
    return jsonResponse(res, 409, { message: "Selected dates are no longer available." });
  }

  const customer = await db.upsertCustomer({
    email: payload.guest_email,
    full_name: payload.guest_name,
    phone: payload.guest_phone,
  });
  if (!customer) {
    return jsonResponse(res, 500, { message: "Unable to store customer record." });
  }

  const guestCertificateFee = packageDetails.guest_certificate_fee ?? 0;
  const totalPrice = packageDetails.public_price + guestCertificateFee;
  const depositAmount = packageDetails.payment_mode === "deposit"
    ? (packageDetails.deposit_amount ?? 0) + guestCertificateFee
    : totalPrice;

  const resort = fallbackResorts.find((entry) => entry.id === packageDetails.resort_id);

  const booking = await db.createBooking({
    customer_id: customer.id,
    resort_id: packageDetails.resort_id,
    package_id: payload.package_id,
    room_type_id: payload.room_type_id,
    car_type_id: payload.car_type_id,
    concierge_service_id: payload.concierge_service_id,
    guest_name: payload.guest_name,
    guest_email: payload.guest_email,
    guest_phone: payload.guest_phone,
    guest_dob: payload.guest_dob,
    selected_dates: { check_in_date: payload.check_in_date, check_out_date: payload.check_out_date },
    check_in_date: payload.check_in_date,
    check_out_date: payload.check_out_date,
    nights: payload.nights,
    guests_adults: payload.guests_adults ?? 2,
    guests_children: payload.guests_children ?? 0,
    customer_price: totalPrice,
    base_cost: packageDetails.base_cost + guestCertificateFee,
    total_price: totalPrice,
    deposit_amount: depositAmount,
    balance_due: Math.max(0, totalPrice - depositAmount),
    payment_status: "pending",
    booking_status: "pending_payment",
    crm_sync_status: "pending",
    email_status: "pending",
    user_id: null,
  });
  if (!booking) {
    return jsonResponse(res, 500, { message: "Unable to create booking draft." });
  }

  return jsonResponse(res, 200, {
    ...booking,
    resort_name: resort?.name,
  });
}
