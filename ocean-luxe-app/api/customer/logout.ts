import { clearCustomerSessionCookie } from "../_lib/customer-session.js";
import { hashOpaqueToken } from "../_lib/customer-tokens.js";
import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { ensureDbReady, getPool } from "../_lib/neon-db.js";

function parseCookies(req: ApiRequest) {
  const raw = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
  if (!raw) return new Map<string, string>();
  const map = new Map<string, string>();
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    map.set(key, decodeURIComponent(value));
  }
  return map;
}

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const cookies = parseCookies(req);
  const token = cookies.get("ocean_customer_session");

  if (token) {
    await ensureDbReady();
    const pool = getPool();
    await pool.query(`update customer_sessions set revoked_at = now(), updated_at = now() where session_token_hash = $1`, [
      hashOpaqueToken(token),
    ]);
  }

  clearCustomerSessionCookie(res);
  res.status(200).json({ ok: true });
}

export default withErrorHandling(handler);
