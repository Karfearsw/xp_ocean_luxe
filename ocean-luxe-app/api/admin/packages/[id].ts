import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

function buildUpdatePatch(patch: Record<string, unknown>, allowed: string[]) {
  const keys = Object.keys(patch).filter((key) => allowed.includes(key));
  if (!keys.length) return null;
  const values = keys.map((key) => patch[key]);
  const sql = keys.map((key, idx) => `"${key}" = $${idx + 1}`).join(", ");
  return { values, sql };
}

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    res.status(400).json({ message: "Missing id" });
    return;
  }

  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select * from packages where id = $1 limit 1`, [id]);
    if (!rows[0]) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.status(200).json(rows[0]);
    return;
  }

  if (req.method === "PATCH") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    const update = buildUpdatePatch(body, [
      "resort_id",
      "package_name",
      "check_in_rules",
      "check_out_rules",
      "nights",
      "base_cost",
      "markup_amount",
      "public_price",
      "payment_mode",
      "deposit_amount",
      "refundable",
      "active",
      "guest_certificate_fee",
      "slug",
      "summary",
      "details",
      "target_audience",
      "nights_min",
      "nights_max",
      "price_from",
      "includes_car",
      "includes_concierge",
      "is_orlando_only",
      "eligible_resort_ids",
    ]);
    if (!update) {
      res.status(400).json({ message: "No valid fields" });
      return;
    }
    const { rows } = await pool.query(
      `update packages set ${update.sql}, updated_at = now() where id = $${update.values.length + 1} returning *`,
      [...update.values, id]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
