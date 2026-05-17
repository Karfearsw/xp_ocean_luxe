export function bookingConfirmationEmail(bookingReference: string, guestName: string, portalLink?: string | null) {
  return {
    subject: `You're booked with Ocean Luxe - ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h1>You're booked</h1>
      <p>Hi ${guestName}, your Ocean Luxe booking <strong>${bookingReference}</strong> is confirmed.</p>
      <p>We will follow up with itinerary details and support information shortly.</p>
      ${portalLink ? `<p><a href="${portalLink}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#22d3ee; color:#07111f; text-decoration:none; font-weight:600;">Manage my booking</a></p>` : ""}
    </div>`,
  };
}
