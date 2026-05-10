export function finalItineraryEmail(bookingReference: string, guestName: string, providerConfirmationNumber: string) {
  return {
    subject: `Your Ocean Luxe final itinerary - ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h1>Your itinerary is finalized</h1>
      <p>Hi ${guestName}, your booking <strong>${bookingReference}</strong> is now fully fulfilled.</p>
      <p>Provider confirmation number: <strong>${providerConfirmationNumber}</strong></p>
      <p>Please bring a valid photo ID and a major credit card in your name for the resort security deposit at check-in.</p>
    </div>`,
  };
}
