import * as crypto from "node:crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET.");
  return secret;
}

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(token).digest("base64url");
}
