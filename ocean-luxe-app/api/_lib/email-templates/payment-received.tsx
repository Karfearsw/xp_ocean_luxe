export function paymentReceivedEmail(bookingReference: string) {
  return {
    subject: `Payment received for ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;"><p>Your payment for <strong>${bookingReference}</strong> has been received and is awaiting final confirmation workflow processing.</p></div>`,
  };
}
