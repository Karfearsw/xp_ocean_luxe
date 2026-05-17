import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select * from car_types order by is_active desc, category asc, name asc`);
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
    const slug = body?.slug && typeof body.slug === "string" ? body.slug : null;
    const name = body?.name && typeof body.name === "string" ? body.name : null;
    const category = body?.category && typeof body.category === "string" ? body.category : null;
    if (!slug || !name || !category) {
      res.status(400).json({ message: "Missing slug/name/category" });
      return;
    }

    const { rows } = await pool.query(
      `insert into car_types (
        slug, name, brand, category, seats, range_estimate_miles, luggage_capacity_notes,
        is_active, base_daily_rate, default_markup_percent, cleaning_fee, delivery_fee_orlando
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      returning *`,
      [
        slug,
        name,
        typeof body.brand === "string" ? body.brand : null,
        category,
        typeof body.seats === "number" ? body.seats : null,
        typeof body.range_estimate_miles === "number" ? body.range_estimate_miles : null,
        typeof body.luggage_capacity_notes === "string" ? body.luggage_capacity_notes : null,
        typeof body.is_active === "boolean" ? body.is_active : true,
        typeof body.base_daily_rate === "number" ? body.base_daily_rate : 0,
        typeof body.default_markup_percent === "number" ? body.default_markup_percent : 0,
        typeof body.cleaning_fee === "number" ? body.cleaning_fee : 0,
        typeof body.delivery_fee_orlando === "number" ? body.delivery_fee_orlando : 0,
      ]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
