import type { ApiRequest, ApiResponse } from "../_lib/http";
import { withCache } from "../_lib/cache";
import { fallbackPackages, fallbackResorts } from "../_lib/sample-data";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug) {
    res.status(400).json({ message: "Missing resort slug" });
    return;
  }

  const payload = await withCache(`resort:${rawSlug}`, 60000, async () => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const resort = fallbackResorts.find((entry) => entry.slug === rawSlug);
      if (!resort) {
        throw new Error("Resort not found");
      }
      return {
        resort,
        packages: fallbackPackages.filter((entry) => entry.resort_id === resort.id),
      };
    }

    const { data: resort, error: resortError } = await supabase
      .from("resorts")
      .select("*")
      .eq("slug", rawSlug)
      .eq("active", true)
      .single();

    if (resortError || !resort) {
      throw new Error(resortError?.message ?? "Resort not found");
    }

    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("*")
      .eq("resort_id", resort.id)
      .eq("active", true)
      .order("public_price", { ascending: true });

    if (packagesError) {
      throw new Error(packagesError.message);
    }

    return { resort, packages: packages ?? [] };
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(payload);
}
