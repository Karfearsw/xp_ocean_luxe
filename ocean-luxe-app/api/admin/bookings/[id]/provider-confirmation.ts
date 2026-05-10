import { buildCrmPayload } from "../../../_lib/crm-sync.js";
import { getDbAdapter } from "../../../_lib/db-adapter.js";
import { finalItineraryEmail } from "../../../_lib/email-templates/final-itinerary.js";
import type { ApiRequest, ApiResponse } from "../../../_lib/http.js";
import { isAdminAuthorized } from "../../../_lib/admin-auth.js";
import { getResend } from "../../../_lib/resend.js";

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const rawBookingId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!rawBookingId) {
    res.status(400).json({ message: "Missing booking id" });
    return;
  }

  const providerConfirmationNumber =
    req.body && typeof req.body === "object" && "provider_confirmation_number" in req.body && typeof req.body.provider_confirmation_number === "string"
      ? req.body.provider_confirmation_number.trim()
      : "";

  if (!providerConfirmationNumber) {
    res.status(400).json({ message: "provider_confirmation_number is required" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(500).json({ message: "Database unavailable" });
    return;
  }

  const booking = await db.markBooking(rawBookingId, {
    provider_confirmation_number: providerConfirmationNumber,
    booking_status: "confirmed",
    crm_sync_status: "pending",
  });

  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  await db.enqueueCrmJobs([
    {
      booking_id: booking.id,
      destination: "crm_rest",
      payload: buildCrmPayload({ ...booking, event_type: "provider_confirmation_added" }),
    },
    {
      booking_id: booking.id,
      destination: "discord",
      payload: buildCrmPayload({ ...booking, event_type: "provider_confirmation_added" }),
    },
  ]);

  await sendEmail(
    booking.guest_email,
    finalItineraryEmail(booking.id, booking.guest_name, providerConfirmationNumber)
  );

  res.status(200).json({ ok: true, booking });
}
