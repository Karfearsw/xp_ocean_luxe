export function bookingConfirmationEmail(bookingReference: string, guestName: string) {
  return {
    subject: `You're booked with Ocean Luxe - ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;"><h1>You're booked</h1><p>Hi ${guestName}, your Ocean Luxe booking <strong>${bookingReference}</strong> is confirmed.</p><p>We will follow up with itinerary details and support information shortly.</p></div>`,
  };
}
