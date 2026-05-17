import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { isAdminAuthenticated } from "../_lib/admin-session.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  res.status(200).json({ authenticated: isAdminAuthenticated(req) });
}

export default withErrorHandling(handler);
