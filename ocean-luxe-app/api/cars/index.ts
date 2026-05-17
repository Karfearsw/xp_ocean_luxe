import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { getPool } from "../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(200).json({ cars: [] });
    return;
  }

  const pool = getPool();
  const orlandoOnly = typeof req.query.orlandoOnly === "string" ? req.query.orlandoOnly === "true" : false;

  const { rows } = await pool.query(
    `select *
     from car_types
     where is_active = true
       and ($1::boolean = false or delivery_fee_orlando > 0)
     order by category asc, name asc`,
    [orlandoOnly]
  );

  res.status(200).json({ cars: rows });
}

export default withErrorHandling(handler);

