import type { ApiRequest, ApiResponse } from "../_lib/http";
import { withCache } from "../_lib/cache";
import { fallbackPackages, fallbackResorts } from "../_lib/sample-data";
import { getDbAdapter } from "../_lib/db-adapter";

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
        throw new Error("Resort not found");
      }
      return {
        resort,
        packages: fallbackPackages.filter((entry) => entry.resort_id === resort.id),
      };
    }
    const result = await db.getResortWithPackages(rawSlug);
    if (!result) {
      throw new Error("Resort not found");
    }
    return result;
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(payload);
}
