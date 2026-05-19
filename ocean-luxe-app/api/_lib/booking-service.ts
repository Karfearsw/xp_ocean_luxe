import { bookingDraftSchema } from "../../../shared/contracts/bookings";
import type { ApiResponse } from "./http.js";
import { fallbackPackages, fallbackResorts } from "./sample-data.js";
import { getDbAdapter } from "./db-adapter.js";
import { computeBookingTotals } from "./pricing.js";

function jsonResponse(res: ApiResponse, status: number, payload: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

function toNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function ageAtDate(dob: string, atDate: string) {
  const birth = new Date(dob);
  const target = new Date(atDate);
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(target.getTime())) return null;
  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export async function createBookingDraftRecord(res: ApiResponse, body: unknown) {
  const parsed = bookingDraftSchema.safeParse(body);
  if ("error" in parsed) {
    return jsonResponse(res, 400, { message: parsed.error.flatten() });
  }

  const db = getDbAdapter();
  const payload = parsed.data;
  const checkInDate = payload.check_in_date;
  const age = ageAtDate(payload.guest_dob, checkInDate);
  const ageRule = db ? await db.getResortCheckinAgeRule(payload.resort_id) : null;
  const effectiveMinAge = ageRule?.min_override ?? ageRule?.min_default ?? 21;
  if (age == null || age < effectiveMinAge) {
    return jsonResponse(res, 400, { message: `Primary guest must be at least ${effectiveMinAge} years old at check-in.` });
  }

  const conciergeIds = payload.concierge_service_ids ?? [];

  if (!db) {
    const packageDetails = fallbackPackages.find((entry) => entry.id === payload.package_id);
    const bookingId = crypto.randomUUID();
    const guestCertificateFee = packageDetails?.guest_certificate_fee ?? 0;
    const totals = computeBookingTotals({
      payment_mode: packageDetails?.payment_mode === "deposit" ? "deposit" : "full",
      public_price: packageDetails?.public_price ?? 0,
      deposit_amount: packageDetails?.deposit_amount ?? 0,
      guest_certificate_fee: guestCertificateFee,
      nights: payload.nights,
      isOrlandoSupported: true,
      carType: null,
      conciergeServices: [],
    });
    const baseCost = (packageDetails?.base_cost ?? 0) + guestCertificateFee;
    const depositAmount = packageDetails?.payment_mode === "deposit" ? (packageDetails?.deposit_amount ?? 0) : totals.total_price;
    return jsonResponse(res, 200, {
      id: bookingId,
      ...payload,
      selected_dates: { check_in_date: payload.check_in_date, check_out_date: payload.check_out_date },
      customer_price: totals.total_price,
      base_cost: baseCost,
      margin: totals.total_price - baseCost,
      total_price: totals.total_price,
      deposit_amount: depositAmount,
      due_now: totals.due_now,
      balance_due: totals.balance_due,
      car_total: totals.car_total,
      concierge_total: totals.concierge_total,
      car_daily_rate: totals.car_daily_rate,
      car_cleaning_fee: totals.car_cleaning_fee,
      car_delivery_fee: totals.car_delivery_fee,
      car_markup_percent: totals.car_markup_percent,
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

  const isOrlandoSupported = await db.getResortOrlandoSupport(packageDetails.resort_id);
  if (isOrlandoSupported == null) {
    return jsonResponse(res, 400, { message: "Resort unavailable." });
  }

  const carType = payload.car_type_id ? await db.getCarTypeById(payload.car_type_id) : null;
  if (payload.car_type_id && !carType) {
    return jsonResponse(res, 400, { message: "Selected car type is unavailable." });
  }
  if (carType && !isOrlandoSupported && toNumber(carType.delivery_fee_orlando) > 0) {
    return jsonResponse(res, 400, { message: "Selected car type is available only for Orlando-supported stays." });
  }

  const conciergeServices = conciergeIds.length ? await db.getConciergeServicesByIds(conciergeIds) : [];
  if (conciergeIds.length && conciergeServices.length !== conciergeIds.length) {
    return jsonResponse(res, 400, { message: "One or more concierge services are unavailable." });
  }
  if (!isOrlandoSupported && conciergeServices.some((service) => service.is_orlando_only === true)) {
    return jsonResponse(res, 400, { message: "Concierge services are available only for Orlando-supported stays." });
  }

  if (payload.room_type_id) {
    const isValidRoom = await db.isRoomTypeForResort(payload.room_type_id, packageDetails.resort_id);
    if (!isValidRoom) {
      return jsonResponse(res, 400, { message: "Selected room type is unavailable." });
    }
  }

  const holdTtlMinutes = Number.isFinite(Number(process.env.AVAILABILITY_HOLD_TTL_MINUTES))
    ? Number(process.env.AVAILABILITY_HOLD_TTL_MINUTES)
    : 30;
  const holdExpiresAt = new Date(Date.now() + holdTtlMinutes * 60 * 1000).toISOString();

  const availabilityBlockId = await db.lockAvailability(
    payload.package_id,
    payload.check_in_date,
    payload.check_out_date,
    holdExpiresAt
  );
  if (!availabilityBlockId) {
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

  const guestCertificateFee = toNumber(packageDetails.guest_certificate_fee);
  const totals = computeBookingTotals({
    payment_mode: packageDetails.payment_mode,
    public_price: packageDetails.public_price,
    deposit_amount: packageDetails.deposit_amount ?? 0,
    guest_certificate_fee: guestCertificateFee,
    nights: payload.nights,
    isOrlandoSupported,
    carType,
    conciergeServices,
  });

  const baseCarCost = carType
    ? toNumber(carType.base_daily_rate) * Math.max(1, payload.nights)
      + toNumber(carType.cleaning_fee)
      + (isOrlandoSupported ? toNumber(carType.delivery_fee_orlando) : 0)
    : 0;
  const baseConciergeCost = conciergeServices.reduce((sum, entry) => sum + toNumber(entry.base_fee), 0);
  const depositAmount = packageDetails.payment_mode === "deposit" ? toNumber(packageDetails.deposit_amount) : totals.total_price;

  const resort = fallbackResorts.find((entry) => entry.id === packageDetails.resort_id);

  const booking = await db.createBooking({
    customer_id: customer.id,
    resort_id: packageDetails.resort_id,
    package_id: payload.package_id,
    availability_block_id: availabilityBlockId,
    room_type_id: payload.room_type_id,
    car_type_id: payload.car_type_id,
    concierge_service_id: conciergeIds[0] ?? null,
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
    customer_price: totals.total_price,
    base_cost: toNumber(packageDetails.base_cost) + guestCertificateFee + baseCarCost + baseConciergeCost,
    total_price: totals.total_price,
    deposit_amount: depositAmount,
    due_now: totals.due_now,
    car_total: totals.car_total,
    concierge_total: totals.concierge_total,
    car_daily_rate: totals.car_daily_rate,
    car_cleaning_fee: totals.car_cleaning_fee,
    car_delivery_fee: totals.car_delivery_fee,
    car_markup_percent: totals.car_markup_percent,
    balance_due: totals.balance_due,
    payment_status: "pending",
    booking_status: "pending_payment",
    crm_sync_status: "pending",
    email_status: "pending",
    user_id: null,
  });
  if (!booking) {
    return jsonResponse(res, 500, { message: "Unable to create booking draft." });
  }

  if (conciergeServices.length) {
    await db.replaceBookingConciergeServices(
      booking.id,
      conciergeServices.map((service) => ({
        concierge_service_id: service.id,
        service_name: String(service.name ?? "Concierge service"),
        base_fee: toNumber(service.base_fee),
        per_hour_rate: toNumber(service.per_hour_rate),
      }))
    );
  }

  return jsonResponse(res, 200, {
    ...booking,
    concierge_service_ids: conciergeIds,
    resort_name: resort?.name,
  });
}
