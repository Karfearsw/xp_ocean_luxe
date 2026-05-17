import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { getCustomerFromRequest } from "../_lib/customer-session.js";
import { ensureDbReady, getPool } from "../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const customer = await getCustomerFromRequest(req);
  if (!customer) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  await ensureDbReady();
  const pool = getPool();
  const { rows } = await pool.query(
    `select
       b.id,
       b.booking_status,
       b.payment_status,
       b.check_in_date,
       b.check_out_date,
       b.nights,
       b.total_price,
       r.name as resort_name,
       p.package_name
     from bookings b
     left join resorts r on r.id = b.resort_id
     left join packages p on p.id = b.package_id
     where b.customer_id = $1
     order by b.created_at desc
     limit 50`,
    [customer.id]
  );

  res.status(200).json({ bookings: rows });
}

export default withErrorHandling(handler);
