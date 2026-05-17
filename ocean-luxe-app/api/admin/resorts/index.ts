import type { ApiRequest, ApiResponse } from "../../_lib/http.js";
import { withErrorHandling } from "../../_lib/handler.js";
import { requireAdmin } from "../../_lib/admin-session.js";
import { getPool } from "../../_lib/neon-db.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  requireAdmin(req);

  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(`select * from resorts order by created_at desc`);
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : null;
    const name = body?.name && typeof body.name === "string" ? body.name : null;
    const slug = body?.slug && typeof body.slug === "string" ? body.slug : null;
    if (!name || !slug) {
      res.status(400).json({ message: "Missing name/slug" });
      return;
    }

    const payload = {
      name,
      slug,
      destination: typeof body.destination === "string" ? body.destination : "Orlando/Kissimmee",
      brand: typeof body.brand === "string" ? body.brand : "Westgate",
      region: typeof body.region === "string" ? body.region : "Orlando",
      address_line1: typeof body.address_line1 === "string" ? body.address_line1 : "",
      address_line2: typeof body.address_line2 === "string" ? body.address_line2 : null,
      city: typeof body.city === "string" ? body.city : "",
      state: typeof body.state === "string" ? body.state : null,
      zip: typeof body.zip === "string" ? body.zip : null,
      country: typeof body.country === "string" ? body.country : "US",
      description: typeof body.description === "string" ? body.description : "",
      description_short: typeof body.description_short === "string" ? body.description_short : null,
      description_long: typeof body.description_long === "string" ? body.description_long : null,
      hero_image_url: typeof body.hero_image_url === "string" ? body.hero_image_url : null,
      gallery_images: Array.isArray(body.gallery_images) ? JSON.stringify(body.gallery_images) : "[]",
      amenities: Array.isArray(body.amenities) ? JSON.stringify(body.amenities) : "[]",
      active: typeof body.active === "boolean" ? body.active : true,
      is_published: typeof body.is_published === "boolean" ? body.is_published : false,
      has_water_park: typeof body.has_water_park === "boolean" ? body.has_water_park : false,
      has_beach_access: typeof body.has_beach_access === "boolean" ? body.has_beach_access : false,
      is_ranch: typeof body.is_ranch === "boolean" ? body.is_ranch : false,
      is_orlando_concierge_supported:
        typeof body.is_orlando_concierge_supported === "boolean" ? body.is_orlando_concierge_supported : false,
      min_nightly_rate: typeof body.min_nightly_rate === "number" ? body.min_nightly_rate : null,
      max_nightly_rate: typeof body.max_nightly_rate === "number" ? body.max_nightly_rate : null,
      reference_notes: typeof body.reference_notes === "string" ? body.reference_notes : null,
    };

    const { rows } = await pool.query(
      `insert into resorts (
        name, slug, destination, brand, region,
        address_line1, address_line2, city, state, zip, country,
        description, description_short, description_long,
        amenities, hero_image_url, gallery_images,
        active, is_published,
        has_water_park, has_beach_access, is_ranch, is_orlando_concierge_supported,
        min_nightly_rate, max_nightly_rate, reference_notes
      ) values (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11,
        $12,$13,$14,
        $15::jsonb,$16,$17::jsonb,
        $18,$19,
        $20,$21,$22,$23,
        $24,$25,$26
      )
      returning *`,
      [
        payload.name,
        payload.slug,
        payload.destination,
        payload.brand,
        payload.region,
        payload.address_line1,
        payload.address_line2,
        payload.city,
        payload.state,
        payload.zip,
        payload.country,
        payload.description,
        payload.description_short,
        payload.description_long,
        payload.amenities,
        payload.hero_image_url,
        payload.gallery_images,
        payload.active,
        payload.is_published,
        payload.has_water_park,
        payload.has_beach_access,
        payload.is_ranch,
        payload.is_orlando_concierge_supported,
        payload.min_nightly_rate,
        payload.max_nightly_rate,
        payload.reference_notes,
      ]
    );
    res.status(200).json(rows[0]);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default withErrorHandling(handler);
