import type { ApiRequest } from "./http";

export function isAdminAuthorized(req: ApiRequest) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  if (!configuredToken) return false;

  const authHeader = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return token === configuredToken;
}
