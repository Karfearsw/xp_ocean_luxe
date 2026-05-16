import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withCache } from "../_lib/cache.js";
import { fallbackResorts } from "../_lib/sample-data.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { withErrorHandling } from "../_lib/handler.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const destination = typeof req.query.destination === "string" ? req.query.destination : undefined;
  const key = `resorts:${destination ?? 'all'}`;

  const resorts = await withCache(key, 60000, async () => {
    const db = getDbAdapter();
    if (!db) {
      return fallbackResorts.filter((resort) => !destination || resort.destination === destination);
    }
    return db.getActiveResorts(destination);
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(resorts);
}

export default withErrorHandling(handler);
