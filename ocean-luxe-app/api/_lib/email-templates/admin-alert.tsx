export function adminAlertEmail(bookingReference: string) {
  return {
    subject: `Admin alert for booking ${bookingReference}`,
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;"><p>An admin follow-up is needed for booking <strong>${bookingReference}</strong>.</p></div>`,
  };
}
