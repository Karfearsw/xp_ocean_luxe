import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { processPendingQueue } from "../_lib/crm-sync.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const result = await processPendingQueue();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unable to process CRM queue" });
  }
}
