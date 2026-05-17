import type { ApiRequest } from "./http.js";

function normalize(url: string) {
  return url.replace(/\/+$/, "");
}

export function resolvePublicOrigin(req?: ApiRequest) {
  const configured = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || process.env.PUBLIC_APP_URL;
  if (configured) return normalize(configured);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${normalize(vercel)}`;

  if (!req) return null;

  const proto = Array.isArray(req.headers["x-forwarded-proto"]) ? req.headers["x-forwarded-proto"][0] : req.headers["x-forwarded-proto"];
  const host = Array.isArray(req.headers["x-forwarded-host"]) ? req.headers["x-forwarded-host"][0] : req.headers["x-forwarded-host"];
  const fallbackHost = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  const resolvedHost = host || fallbackHost;

  if (!resolvedHost) return null;
  return `${proto || "https"}://${resolvedHost}`;
}
