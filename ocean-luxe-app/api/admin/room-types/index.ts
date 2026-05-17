import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(
      `select rt.*, r.slug as resort_slug, r.name as resort_name
       from room_types rt
       join resorts r on r.id = rt.resort_id
       order by r.name asc, rt.max_occupancy asc, rt.name asc`
    );
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
    const resort_id = body?.resort_id && typeof body.resort_id === "string" ? body.resort_id : null;
    const name = body?.name && typeof body.name === "string" ? body.name : null;
    const max_occupancy = typeof body?.max_occupancy === "number" ? body.max_occupancy : null;
    if (!resort_id || !name || !max_occupancy) {
      res.status(400).json({ message: "Missing resort_id/name/max_occupancy" });
      return;
    }

    const { rows } = await pool.query(
      `insert into room_types (
        resort_id, name, max_occupancy, bed_config, kitchen_type, bath_features,
        has_balcony_or_patio, has_washer_dryer, internal_code,
        base_owner_cost_per_night, default_markup_percent, is_active
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      returning *`,
      [
        resort_id,
        name,
        max_occupancy,
        typeof body.bed_config === "string" ? body.bed_config : null,
        typeof body.kitchen_type === "string" ? body.kitchen_type : null,
        typeof body.bath_features === "string" ? body.bath_features : null,
        typeof body.has_balcony_or_patio === "boolean" ? body.has_balcony_or_patio : false,
        typeof body.has_washer_dryer === "boolean" ? body.has_washer_dryer : false,
        typeof body.internal_code === "string" ? body.internal_code : null,
        typeof body.base_owner_cost_per_night === "number" ? body.base_owner_cost_per_night : 0,
        typeof body.default_markup_percent === "number" ? body.default_markup_percent : 0,
        typeof body.is_active === "boolean" ? body.is_active : true,
      ]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
