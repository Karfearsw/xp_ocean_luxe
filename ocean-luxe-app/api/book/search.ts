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
    res.status(200).json({ results: [] });
    return;
  }

  const region = typeof req.query.region === "string" ? req.query.region : undefined;
  const resortSlug = typeof req.query.resort === "string" ? req.query.resort : undefined;
  const guests = typeof req.query.guests === "string" ? Number(req.query.guests) : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

  if (!startDate || !endDate) {
    res.status(400).json({ message: "Missing startDate/endDate" });
    return;
  }

  const pool = getPool();
  const params: Array<string | number> = [startDate, endDate];
  let where = `where r.active = true and r.is_published = true`;

  if (region) {
    params.push(region);
    where += ` and r.region = $${params.length}`;
  }
  if (resortSlug) {
    params.push(resortSlug);
    where += ` and r.slug = $${params.length}`;
  }
  if (Number.isFinite(guests)) {
    params.push(guests);
    where += ` and rt.max_occupancy >= $${params.length}`;
  }

  const { rows } = await pool.query(
    `
    select
      r.id as resort_id,
      r.slug as resort_slug,
      r.name as resort_name,
      r.city,
      r.state,
      r.country,
      r.region,
      r.destination,
      r.hero_image_url,
      r.is_orlando_concierge_supported,
      rt.id as room_type_id,
      rt.name as room_type_name,
      rt.max_occupancy,
      p.id as package_id,
      p.package_name,
      p.payment_mode,
      p.deposit_amount,
      p.public_price,
      p.guest_certificate_fee,
      p.markup_amount
    from resorts r
    join room_types rt on rt.resort_id = r.id and rt.is_active = true
    join packages p on p.resort_id = r.id and p.active = true
    where exists (
      select 1 from availability_blocks ab
      where ab.resort_id = r.id
        and ab.package_id = p.id
        and ab.status = 'available'
        and ab.start_date <= $1::date
        and ab.end_date >= $2::date
    )
    ${where.replace("where", "and")}
    order by r.region asc, r.name asc, rt.max_occupancy asc, p.public_price asc
    limit 200
    `,
    params
  );

  res.status(200).json({ results: rows });
}

export default withErrorHandling(handler);
