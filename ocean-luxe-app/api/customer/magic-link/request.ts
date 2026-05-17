import { customerMagicLinkEmail } from "../../_lib/email-templates/customer-magic-link.js";
import { createOpaqueToken, hashOpaqueToken } from "../../_lib/customer-tokens.js";
import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { ensureDbReady, getPool } from "../../_lib/neon-db.js";
import { resolvePublicOrigin } from "../../_lib/public-origin.js";
import { getResend } from "../../_lib/resend.js";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeRedirectPath(value: unknown) {
  if (typeof value !== "string") return "/account/bookings";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/account/bookings";
  if (trimmed.startsWith("//")) return "/account/bookings";
  if (trimmed.includes("://")) return "/account/bookings";
  return trimmed;
}

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

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
  const rawEmail = body && typeof body.email === "string" ? body.email : null;
  const email = rawEmail ? normalizeEmail(rawEmail) : null;

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ message: "Invalid email" });
    return;
  }

  const redirectPath = sanitizeRedirectPath(body?.redirectPath);

  await ensureDbReady();
  const pool = getPool();
  const client = await pool.connect();

  let token: string | null = null;
  let customerEmail: string | null = null;

  try {
    await client.query("begin");
    const customerResult = await client.query(`select id, email from customers where email = $1 limit 1`, [email]);
    let customerId = customerResult.rows[0]?.id as string | undefined;
    customerEmail = customerResult.rows[0]?.email as string | undefined;

    if (!customerId) {
      const bookingResult = await client.query(
        `select guest_name, guest_phone
         from bookings
         where guest_email = $1
         order by created_at desc
         limit 1`,
        [email]
      );

      const booking = bookingResult.rows[0] as { guest_name?: string; guest_phone?: string | null } | undefined;
      if (booking) {
        const created = await client.query(
          `insert into customers (email, full_name, phone)
           values ($1, $2, $3)
           on conflict (email)
           do update set full_name = excluded.full_name, phone = excluded.phone, updated_at = now()
           returning id, email`,
          [email, booking.guest_name ?? "Ocean Luxe Guest", booking.guest_phone ?? null]
        );
        customerId = created.rows[0]?.id as string | undefined;
        customerEmail = created.rows[0]?.email as string | undefined;

        if (customerId) {
          await client.query(
            `update bookings set customer_id = $1, updated_at = now() where guest_email = $2 and customer_id is null`,
            [customerId, email]
          );
        }
      }
    }

    if (customerId) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const candidate = createOpaqueToken();
        const candidateHash = hashOpaqueToken(candidate);
        try {
          await client.query(
            `insert into customer_magic_links (customer_id, token_hash, redirect_path, expires_at)
             values ($1, $2, $3, now() + interval '30 minutes')`,
            [customerId, candidateHash, redirectPath]
          );
          token = candidate;
          break;
        } catch (error) {
          const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : null;
          if (code !== "23505") throw error;
        }
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  const origin = resolvePublicOrigin(req);
  const link = origin && token ? `${origin}/account/magic?token=${encodeURIComponent(token)}` : null;

  if (customerEmail && link) {
    await sendEmail(customerEmail, customerMagicLinkEmail(link));
  }

  res.status(200).json({ ok: true });
}

export default withErrorHandling(handler);
