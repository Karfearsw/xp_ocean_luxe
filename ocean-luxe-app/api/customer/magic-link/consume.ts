import { createOpaqueToken, hashOpaqueToken } from "../../_lib/customer-tokens.js";
import { setCustomerSessionCookie } from "../../_lib/customer-session.js";
import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { ensureDbReady, getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
  const rawToken = body && typeof body.token === "string" ? body.token : null;
  const token = rawToken ? rawToken.trim() : null;

  if (!token) {
    res.status(400).json({ message: "Missing token" });
    return;
  }

  const tokenHash = hashOpaqueToken(token);

  await ensureDbReady();
  const pool = getPool();
  const client = await pool.connect();

  let customerId: string | null = null;
  let redirectPath: string | null = null;
  let sessionToken: string | null = null;

  try {
    await client.query("begin");

    const consumed = await client.query(
      `update customer_magic_links
       set consumed_at = now(), updated_at = now()
       where token_hash = $1
         and consumed_at is null
         and expires_at > now()
       returning customer_id, redirect_path`,
      [tokenHash]
    );

    const row = consumed.rows[0] as { customer_id?: string; redirect_path?: string } | undefined;
    if (!row?.customer_id) {
      await client.query("rollback");
      res.status(400).json({ message: "Invalid or expired link" });
      return;
    }

    customerId = row.customer_id ?? null;
    redirectPath = row.redirect_path ?? "/account/bookings";

    sessionToken = createOpaqueToken();
    const sessionHash = hashOpaqueToken(sessionToken);

    await client.query(
      `insert into customer_sessions (customer_id, session_token_hash, expires_at, last_seen_at)
       values ($1, $2, now() + interval '30 days', now())`,
      [customerId, sessionHash]
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  if (!sessionToken) {
    res.status(500).json({ message: "Unable to create session" });
    return;
  }

  setCustomerSessionCookie(res, sessionToken, 60 * 60 * 24 * 30);
  res.status(200).json({ ok: true, redirectPath: redirectPath ?? "/account/bookings" });
}

export default withErrorHandling(handler);
