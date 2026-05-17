import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { getPool } from "../_lib/neon-db.js";

function groupBy<T extends { region: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.region || "Other";
    const existing = map.get(key) ?? [];
    existing.push(row);
    map.set(key, existing);
  }
  return Array.from(map.entries()).map(([region, resorts]) => ({ region, resorts }));
}

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(200).json({ regions: [] });
    return;
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `select id, slug, name, city, state, country, destination, region, hero_image_url, min_nightly_rate, max_nightly_rate,
            has_water_park, has_beach_access, is_ranch, is_orlando_concierge_supported
     from resorts
     where active = true and is_published = true
     order by region asc, name asc`
  );

  res.status(200).json({ regions: groupBy(rows) });
}

export default withErrorHandling(handler);
