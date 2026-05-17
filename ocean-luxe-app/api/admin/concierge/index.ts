import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select * from concierge_services order by is_orlando_only desc, name asc`);
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
    const slug = body?.slug && typeof body.slug === "string" ? body.slug : null;
    const name = body?.name && typeof body.name === "string" ? body.name : null;
    if (!slug || !name) {
      res.status(400).json({ message: "Missing slug/name" });
      return;
    }
    const { rows } = await pool.query(
      `insert into concierge_services (
        slug, name, description, is_orlando_only, base_fee, per_hour_rate, max_party_size, requires_car_type_id
      ) values ($1,$2,$3,$4,$5,$6,$7,$8)
      returning *`,
      [
        slug,
        name,
        typeof body.description === "string" ? body.description : null,
        typeof body.is_orlando_only === "boolean" ? body.is_orlando_only : true,
        typeof body.base_fee === "number" ? body.base_fee : 0,
        typeof body.per_hour_rate === "number" ? body.per_hour_rate : 0,
        typeof body.max_party_size === "number" ? body.max_party_size : null,
        typeof body.requires_car_type_id === "string" ? body.requires_car_type_id : null,
      ]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
