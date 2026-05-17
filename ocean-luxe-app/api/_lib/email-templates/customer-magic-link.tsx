export function customerMagicLinkEmail(link: string) {
  return {
    subject: "Your Ocean Luxe sign-in link",
    html: `<div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h1>Sign in to Ocean Luxe</h1>
      <p>Use the secure link below to access your bookings. This link expires soon.</p>
      <p><a href="${link}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#22d3ee; color:#07111f; text-decoration:none; font-weight:600;">Open my bookings</a></p>
      <p style="font-size: 12px; color: #475569;">If you did not request this email, you can ignore it.</p>
    </div>`,
  };
}
