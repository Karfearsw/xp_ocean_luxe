import { availabilitySearchSchema } from "../../../shared/contracts/bookings";
import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { fallbackAvailability } from "../_lib/sample-data.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { withErrorHandling } from "../_lib/handler.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const parsed = availabilitySearchSchema.safeParse({
    resortId: typeof req.query.resortId === "string" ? req.query.resortId : undefined,
    destination: typeof req.query.destination === "string" ? req.query.destination : undefined,
    startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
  });

  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(200).json(fallbackAvailability);
    return;
  }

  const data = await db.searchAvailableBlocks({
    resortId: parsed.data.resortId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(data ?? []);
}

export default withErrorHandling(handler);
