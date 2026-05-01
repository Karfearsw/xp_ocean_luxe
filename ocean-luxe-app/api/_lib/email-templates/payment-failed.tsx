export function paymentFailedEmail(bookingReference: string) {
  return {
    subject: `Payment issue for ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;"><p>We could not confirm payment for <strong>${bookingReference}</strong>. Please retry checkout or contact Ocean Luxe support.</p></div>`,
  };
}
