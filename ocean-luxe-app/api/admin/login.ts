import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { setAdminSessionCookie } from "../_lib/admin-session.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    res.status(500).json({ message: "Missing ADMIN_PASSWORD." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
  const password = body && typeof body.password === "string" ? body.password : null;

  if (!password) {
    res.status(400).json({ message: "Missing password" });
    return;
  }

  if (password !== configured) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  setAdminSessionCookie(res, 60 * 60 * 24 * 7);
  res.status(200).json({ ok: true });
}

export default withErrorHandling(handler);
