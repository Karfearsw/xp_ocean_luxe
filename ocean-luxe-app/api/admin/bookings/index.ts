import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const pool = getPool();
  const params: Array<string | number> = [];
  let where = "where 1=1";
  if (status) {
    params.push(status);
    where += ` and booking_status = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
    select
      b.*,
      r.name as resort_name,
      p.package_name
    from bookings b
    join resorts r on r.id = b.resort_id
    join packages p on p.id = b.package_id
    ${where}
    order by b.created_at desc
    limit 200
    `,
    params
  );

  res.status(200).json(rows);
}

export default withErrorHandling(handler);
