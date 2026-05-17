import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { getPool } from "../_lib/neon-db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(200).json({ released: 0, mode: "fallback" });
    return;
  }

  const pool = getPool();
  const { rowCount } = await pool.query(
    `update availability_blocks
     set status = 'available',
         hold_expires_at = null,
         held_at = null,
         updated_at = now()
     where status = 'held'
       and hold_expires_at is not null
       and hold_expires_at <= now()`
  );

  res.status(200).json({ released: rowCount ?? 0 });
}
