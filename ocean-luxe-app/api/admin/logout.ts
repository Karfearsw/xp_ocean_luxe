import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { clearAdminSessionCookie } from "../_lib/admin-session.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  clearAdminSessionCookie(res);
  res.status(200).json({ ok: true });
}

export default withErrorHandling(handler);
