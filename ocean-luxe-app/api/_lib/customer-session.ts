import type { ApiRequest, ApiResponse } from "./http.js";
import { ensureDbReady, getPool } from "./neon-db.js";
import { hashOpaqueToken } from "./customer-tokens.js";

type CustomerIdentity = {
  id: string;
  email: string;
  full_name: string;
};

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

export function setCustomerSessionCookie(res: ApiResponse, token: string, ttlSeconds: number) {
  const secure = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const cookie = [
    `ocean_customer_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ttlSeconds}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function clearCustomerSessionCookie(res: ApiResponse) {
  const secure = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const cookie = [
    "ocean_customer_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export async function getCustomerFromRequest(req: ApiRequest): Promise<CustomerIdentity | null> {
  const cookies = parseCookies(req);
  const token = cookies.get("ocean_customer_session");
  if (!token) return null;
  const tokenHash = hashOpaqueToken(token);

  await ensureDbReady();
  const pool = getPool();

  const { rows } = await pool.query(
    `select c.id, c.email, c.full_name
     from customer_sessions cs
     join customers c on c.id = cs.customer_id
     where cs.session_token_hash = $1
       and cs.revoked_at is null
       and cs.expires_at > now()
     limit 1`,
    [tokenHash]
  );

  const customer = rows[0] as CustomerIdentity | undefined;
  if (!customer) return null;

  await pool.query(`update customer_sessions set last_seen_at = now(), updated_at = now() where session_token_hash = $1`, [tokenHash]);

  return customer;
}
