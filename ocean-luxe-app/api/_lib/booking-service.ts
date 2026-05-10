import { bookingDraftSchema } from "../../../shared/contracts/bookings";
import type { ApiResponse } from "./http";
import { fallbackPackages, fallbackResorts } from "./sample-data";
import { getDbAdapter } from "./db-adapter";

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
    return jsonResponse(res, 200, {
      id: bookingId,
      ...payload,
      selected_dates: { check_in_date: payload.check_in_date, check_out_date: payload.check_out_date },
      customer_price: packageDetails?.payment_mode === "deposit" ? packageDetails.deposit_amount ?? 0 : packageDetails?.public_price ?? 0,
      base_cost: packageDetails?.base_cost ?? 0,
      margin: (packageDetails?.payment_mode === "deposit" ? packageDetails.deposit_amount ?? 0 : packageDetails?.public_price ?? 0) - (packageDetails?.base_cost ?? 0),
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

  const amountDue = packageDetails.payment_mode === "deposit"
    ? packageDetails.deposit_amount ?? 0
    : packageDetails.public_price;

  const resort = fallbackResorts.find((entry) => entry.id === packageDetails.resort_id);

  const booking = await db.createBooking({
    customer_id: customer.id,
    resort_id: packageDetails.resort_id,
    package_id: payload.package_id,
    guest_name: payload.guest_name,
    guest_email: payload.guest_email,
    guest_phone: payload.guest_phone,
    guest_dob: payload.guest_dob,
    selected_dates: { check_in_date: payload.check_in_date, check_out_date: payload.check_out_date },
    check_in_date: payload.check_in_date,
    check_out_date: payload.check_out_date,
    nights: payload.nights,
    customer_price: amountDue,
    base_cost: packageDetails.base_cost,
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
