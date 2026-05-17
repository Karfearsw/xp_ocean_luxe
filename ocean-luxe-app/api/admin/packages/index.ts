import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(
      `select p.*, r.slug as resort_slug, r.name as resort_name
       from packages p
       join resorts r on r.id = p.resort_id
       order by r.name asc, p.public_price asc`
    );
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
    const resort_id = body?.resort_id && typeof body.resort_id === "string" ? body.resort_id : null;
    const package_name = body?.package_name && typeof body.package_name === "string" ? body.package_name : null;
    const nights = typeof body?.nights === "number" ? body.nights : null;
    const public_price = typeof body?.public_price === "number" ? body.public_price : null;
    const base_cost = typeof body?.base_cost === "number" ? body.base_cost : null;
    if (!resort_id || !package_name || !nights || public_price == null || base_cost == null) {
      res.status(400).json({ message: "Missing resort_id/package_name/nights/public_price/base_cost" });
      return;
    }

    const payment_mode = body?.payment_mode === "deposit" ? "deposit" : "full";
    const deposit_amount = payment_mode === "deposit" && typeof body.deposit_amount === "number" ? body.deposit_amount : null;

    const { rows } = await pool.query(
      `insert into packages (
        resort_id, package_name, check_in_rules, check_out_rules, nights,
        base_cost, markup_amount, public_price,
        payment_mode, deposit_amount, refundable, active,
        guest_certificate_fee,
        slug, summary, details, target_audience, nights_min, nights_max, price_from,
        includes_car, includes_concierge, is_orlando_only, eligible_resort_ids
      ) values (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,
        $13,
        $14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24
      )
      returning *`,
      [
        resort_id,
        package_name,
        typeof body.check_in_rules === "string" ? body.check_in_rules : null,
        typeof body.check_out_rules === "string" ? body.check_out_rules : null,
        nights,
        base_cost,
        typeof body.markup_amount === "number" ? body.markup_amount : 0,
        public_price,
        payment_mode,
        deposit_amount,
        typeof body.refundable === "boolean" ? body.refundable : false,
        typeof body.active === "boolean" ? body.active : true,
        typeof body.guest_certificate_fee === "number" ? body.guest_certificate_fee : 0,
        typeof body.slug === "string" ? body.slug : null,
        typeof body.summary === "string" ? body.summary : null,
        typeof body.details === "string" ? body.details : null,
        typeof body.target_audience === "string" ? body.target_audience : null,
        typeof body.nights_min === "number" ? body.nights_min : null,
        typeof body.nights_max === "number" ? body.nights_max : null,
        typeof body.price_from === "number" ? body.price_from : null,
        typeof body.includes_car === "boolean" ? body.includes_car : false,
        typeof body.includes_concierge === "boolean" ? body.includes_concierge : false,
        typeof body.is_orlando_only === "boolean" ? body.is_orlando_only : false,
        Array.isArray(body.eligible_resort_ids) ? body.eligible_resort_ids : null,
      ]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
