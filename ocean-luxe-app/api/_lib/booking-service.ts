import { bookingDraftSchema } from "../../../shared/contracts/bookings";
import type { ApiResponse } from "./http";
import { getSupabaseAdmin } from "./supabase-admin";
import { fallbackPackages, fallbackResorts } from "./sample-data";

function jsonResponse(res: ApiResponse, status: number, payload: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

export async function createBookingDraftRecord(res: ApiResponse, body: unknown) {
  const parsed = bookingDraftSchema.safeParse(body);
  if ("error" in parsed) {
    return jsonResponse(res, 400, { message: parsed.error.flatten() });
  }

  const supabase = getSupabaseAdmin();
  const payload = parsed.data;

  if (!supabase) {
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
      created_at: new Date().toISOString(),
    });
  }

  const { data: packageDetails, error: packageError } = await supabase
    .from("packages")
    .select("id, resort_id, base_cost, public_price, payment_mode, deposit_amount, active")
    .eq("id", payload.package_id)
    .single();

  if (packageError || !packageDetails || !packageDetails.active) {
    return jsonResponse(res, 404, { message: "Package unavailable." });
  }

  const { data: availabilityCheck, error: availabilityError } = await supabase.rpc("lock_available_block", {
    p_package_id: payload.package_id,
    p_start: payload.check_in_date,
    p_end: payload.check_out_date,
  });

  if (availabilityError || availabilityCheck !== true) {
    return jsonResponse(res, 409, { message: "Selected dates are no longer available." });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      {
        email: payload.guest_email,
        full_name: payload.guest_name,
        phone: payload.guest_phone,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (customerError || !customer) {
    return jsonResponse(res, 500, { message: "Unable to store customer record." });
  }

  const amountDue = packageDetails.payment_mode === "deposit"
    ? packageDetails.deposit_amount ?? 0
    : packageDetails.public_price;

  const resort = fallbackResorts.find((entry) => entry.id === packageDetails.resort_id);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      customer_id: customer.id,
      resort_id: packageDetails.resort_id,
      package_id: payload.package_id,
      guest_name: payload.guest_name,
      guest_email: payload.guest_email,
      guest_phone: payload.guest_phone,
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
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return jsonResponse(res, 500, { message: "Unable to create booking draft." });
  }

  return jsonResponse(res, 200, {
    ...booking,
    resort_name: resort?.name,
  });
}
