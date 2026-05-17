import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { getDbAdapter } from "../_lib/db-adapter.js";
import { getPool } from "../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || typeof id !== "string") {
    res.status(400).json({ message: "Missing id" });
    return;
  }

  const db = getDbAdapter();
  if (!db) {
    res.status(404).json({ message: "Booking lookup unavailable." });
    return;
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    select
      b.id,
      b.resort_id,
      r.name as resort_name,
      b.package_id,
      p.package_name,
      b.room_type_id,
      rt.name as room_type_name,
      b.check_in_date,
      b.check_out_date,
      b.nights,
      b.car_type_id,
      ct.name as car_name,
      b.payment_status,
      b.booking_status,
      b.total_price,
      b.due_now,
      b.balance_due,
      b.car_total,
      b.concierge_total
    from bookings b
    left join resorts r on r.id = b.resort_id
    left join packages p on p.id = b.package_id
    left join room_types rt on rt.id = b.room_type_id
    left join car_types ct on ct.id = b.car_type_id
    where b.id = $1
    limit 1
    `,
    [id]
  );

  const booking = rows[0];
  if (!booking) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  const concierge = await pool.query(
    `select concierge_service_id, service_name, base_fee, per_hour_rate
     from booking_concierge_services
     where booking_id = $1
     order by service_name asc`,
    [id]
  );

  res.status(200).json({
    booking,
    concierge_services: concierge.rows,
  });
}

export default withErrorHandling(handler);

