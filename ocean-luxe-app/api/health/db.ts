import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { ensureDbReady } from "../_lib/neon-db.js";
import { withErrorHandling } from "../_lib/handler.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  await ensureDbReady();
  res.status(200).json({ ok: true });
}

export default withErrorHandling(handler);
