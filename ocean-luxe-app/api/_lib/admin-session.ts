import crypto from "node:crypto";
import type { ApiRequest, ApiResponse } from "./http.js";

type AdminSession = {
  iat: number;
  exp: number;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET.");
  return secret;
}

function sign(payloadB64: string) {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

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

export function setAdminSessionCookie(res: ApiResponse, ttlSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = { iat: now, exp: now + ttlSeconds };
  const payloadB64 = base64UrlEncode(JSON.stringify(session));
  const signature = sign(payloadB64);
  const value = `${payloadB64}.${signature}`;
  const secure = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const cookie = [
    `ocean_admin_session=${encodeURIComponent(value)}`,
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

export function clearAdminSessionCookie(res: ApiResponse) {
  const secure = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const cookie = [
    "ocean_admin_session=",
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

export function isAdminAuthenticated(req: ApiRequest) {
  const cookies = parseCookies(req);
  const token = cookies.get("ocean_admin_session");
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const payloadB64 = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  if (!payloadB64 || !signature) return false;
  const expected = sign(payloadB64);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const payloadRaw = base64UrlDecode(payloadB64);
  const parsed = JSON.parse(payloadRaw) as AdminSession;
  const now = Math.floor(Date.now() / 1000);
  return typeof parsed.exp === "number" && parsed.exp > now;
}

export function requireAdmin(req: ApiRequest) {
  if (!isAdminAuthenticated(req)) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
}

