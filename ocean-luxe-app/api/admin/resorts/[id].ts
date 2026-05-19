import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

function buildUpdatePatch(patch: Record<string, unknown>, allowed: string[]) {
  const keys = Object.keys(patch).filter((key) => allowed.includes(key));
  if (!keys.length) return null;
  const values = keys.map((key) => patch[key]);
  const sql = keys.map((key, idx) => `"${key}" = $${idx + 1}`).join(", ");
  return { values, sql };
}

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    res.status(400).json({ message: "Missing id" });
    return;
  }

  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select * from resorts where id = $1 limit 1`, [id]);
    if (!rows[0]) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.status(200).json(rows[0]);
    return;
  }

  if (req.method === "PATCH") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (key === "amenities" || key === "gallery_images") {
        patch[key] = JSON.stringify(body[key] ?? []);
      } else {
        patch[key] = body[key];
      }
    }

    const update = buildUpdatePatch(patch, [
      "name",
      "property_name",
      "slug",
      "destination",
      "brand",
      "region",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "zip",
      "country",
      "description",
      "description_short",
      "description_long",
      "amenities",
      "hero_image_url",
      "gallery_images",
      "active",
      "is_published",
      "has_water_park",
      "has_beach_access",
      "is_ranch",
      "is_orlando_concierge_supported",
      "min_nightly_rate",
      "max_nightly_rate",
      "official_url",
      "min_checkin_age_default",
      "min_checkin_age_override",
      "from_rate_reference",
      "from_rate_currency",
      "from_rate_source",
      "reference_notes",
    ]);
    if (!update) {
      res.status(400).json({ message: "No valid fields" });
      return;
    }

    const { rows } = await pool.query(
      `update resorts set ${update.sql}, updated_at = now() where id = $${update.values.length + 1} returning *`,
      [...update.values, id]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
