import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withCache } from "../_lib/cache.js";
import { fallbackPackages, fallbackResorts } from "../_lib/sample-data.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { withErrorHandling } from "../_lib/handler.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug) {
    res.status(400).json({ message: "Missing resort slug" });
    return;
  }

  const payload = await withCache(`resort:${rawSlug}`, 60000, async () => {
    const db = getDbAdapter();
    if (!db) {
      const resort = fallbackResorts.find((entry) => entry.slug === rawSlug);
      if (!resort) {
        return null;
      }
      return {
        resort,
        packages: fallbackPackages.filter((entry) => entry.resort_id === resort.id),
      };
    }
    return db.getResortWithPackages(rawSlug);
  });

  if (!payload) {
    res.status(404).json({ message: "Resort not found" });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(payload);
}

export default withErrorHandling(handler);
