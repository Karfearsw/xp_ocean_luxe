import { availabilitySearchSchema } from "../../../shared/contracts/bookings";
import { fallbackAvailability } from "../_lib/sample-data";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const parsed = availabilitySearchSchema.safeParse({
    resortId: typeof req.query.resortId === "string" ? req.query.resortId : undefined,
    destination: typeof req.query.destination === "string" ? req.query.destination : undefined,
    startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
  });

  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error.flatten() });
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.status(200).json(fallbackAvailability);
    return;
  }

  let query = supabase.from("availability_blocks").select("*").eq("status", "available").order("start_date", { ascending: true });
  if (parsed.data.resortId) query = query.eq("resort_id", parsed.data.resortId);
  if (parsed.data.startDate) query = query.gte("start_date", parsed.data.startDate);
  if (parsed.data.endDate) query = query.lte("end_date", parsed.data.endDate);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(data ?? []);
}
