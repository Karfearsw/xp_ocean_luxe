import type { ApiRequest, ApiResponse } from "../_lib/http";
import { withCache } from "../_lib/cache";
import { fallbackResorts } from "../_lib/sample-data";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const destination = typeof req.query.destination === "string" ? req.query.destination : undefined;
  const key = `resorts:${destination ?? 'all'}`;

  const resorts = await withCache(key, 60000, async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return fallbackResorts.filter((resort) => !destination || resort.destination === destination);
    }

    let query = supabase.from("resorts").select("*").eq("active", true).order("name", { ascending: true });
    if (destination) query = query.eq("destination", destination);
    const { data, error } = await query;
    if (error || !data) throw new Error(error?.message ?? "Unable to load resorts");
    return data;
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(resorts);
}
