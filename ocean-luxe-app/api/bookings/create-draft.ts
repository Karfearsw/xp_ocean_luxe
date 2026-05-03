import type { ApiRequest, ApiResponse } from "../_lib/http";
import { createBookingDraftRecord } from "../_lib/booking-service";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  return createBookingDraftRecord(res, req.body);
}
