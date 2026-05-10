/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdmin } from "./supabase-admin";

type QueryValue = string | number | boolean | null;

type SyncJobPatch = {
  status?: string;
  locked_at?: string | null;
  sent_at?: string | null;
  last_error?: string | null;
  attempt_count?: number;
  next_attempt_at?: string;
};

export interface DbAdapter {
  getActiveResorts(destination?: string): Promise<unknown[]>;
  getResortWithPackages(slug: string): Promise<{ resort: any; packages: any[] } | null>;
  searchAvailableBlocks(filters: { resortId?: string; startDate?: string; endDate?: string }): Promise<unknown[]>;
  getBookingById(bookingId: string): Promise<any | null>;
  getPackagePricing(packageId: string): Promise<any | null>;
  markBooking(bookingId: string, patch: Record<string, QueryValue>): Promise<any | null>;
  insertStripeWebhookEvent(payload: Record<string, unknown>): Promise<string | null>;
  enqueueCrmJobs(payload: Array<Record<string, unknown>>): Promise<void>;
  listPendingSyncJobs(limit: number): Promise<any[]>;
  patchSyncJob(jobId: string, patch: SyncJobPatch): Promise<void>;
  getActivePackageById(packageId: string): Promise<any | null>;
  lockAvailability(packageId: string, startDate: string, endDate: string): Promise<boolean>;
  upsertCustomer(payload: { email: string; full_name: string; phone: string }): Promise<any | null>;
  createBooking(payload: Record<string, unknown>): Promise<any | null>;
}

function parseDuplicateMessage(errorMessage?: string | null) {
  if (!errorMessage) return null;
  if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
    return "duplicate";
  }
  return errorMessage;
}

export function getDbAdapter(): DbAdapter | null {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  return {
    async getActiveResorts(destination) {
      let query = supabase.from("resorts").select("*").eq("active", true).order("name", { ascending: true });
      if (destination) query = query.eq("destination", destination);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async getResortWithPackages(slug) {
      const { data: resort, error: resortError } = await supabase
        .from("resorts")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .single();
      if (resortError || !resort) return null;

      const { data: packages, error: packageError } = await supabase
        .from("packages")
        .select("*")
        .eq("resort_id", resort.id)
        .eq("active", true)
        .order("public_price", { ascending: true });

      if (packageError) throw new Error(packageError.message);
      return { resort, packages: packages ?? [] };
    },

    async searchAvailableBlocks(filters) {
      let query = supabase.from("availability_blocks").select("*").eq("status", "available").order("start_date", { ascending: true });
      if (filters.resortId) query = query.eq("resort_id", filters.resortId);
      if (filters.startDate) query = query.gte("start_date", filters.startDate);
      if (filters.endDate) query = query.lte("end_date", filters.endDate);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async getBookingById(bookingId) {
      const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
      if (error || !data) return null;
      return data;
    },

    async getPackagePricing(packageId) {
      const { data, error } = await supabase
        .from("packages")
        .select("payment_mode, deposit_amount, public_price, guest_certificate_fee, base_cost, markup_amount")
        .eq("id", packageId)
        .single();
      if (error || !data) return null;
      return data;
    },

    async markBooking(bookingId, patch) {
      const { data, error } = await supabase.from("bookings").update(patch).eq("id", bookingId).select().single();
      if (error || !data) return null;
      return data;
    },

    async insertStripeWebhookEvent(payload) {
      const { error } = await supabase.from("stripe_webhook_events").insert(payload);
      if (!error) return null;
      return parseDuplicateMessage(error.message);
    },

    async enqueueCrmJobs(payload) {
      const { error } = await supabase.from("crm_sync_queue").insert(payload);
      if (error) throw new Error(error.message);
    },

    async listPendingSyncJobs(limit) {
      const { data, error } = await supabase
        .from("crm_sync_queue")
        .select("*")
        .in("status", ["pending", "failed"])
        .lte("next_attempt_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async patchSyncJob(jobId, patch) {
      const { error } = await supabase.from("crm_sync_queue").update(patch).eq("id", jobId);
      if (error) throw new Error(error.message);
    },

    async getActivePackageById(packageId) {
      const { data, error } = await supabase
        .from("packages")
        .select("id, resort_id, base_cost, public_price, payment_mode, deposit_amount, active, guest_certificate_fee, markup_amount")
        .eq("id", packageId)
        .single();
      if (error || !data || !data.active) return null;
      return data;
    },

    async lockAvailability(packageId, startDate, endDate) {
      const { data, error } = await supabase.rpc("lock_available_block", {
        p_package_id: packageId,
        p_start: startDate,
        p_end: endDate,
      });
      if (error) return false;
      return data === true;
    },

    async upsertCustomer(payload) {
      const { data, error } = await supabase
        .from("customers")
        .upsert(payload, { onConflict: "email" })
        .select()
        .single();
      if (error || !data) return null;
      return data;
    },

    async createBooking(payload) {
      const { data, error } = await supabase.from("bookings").insert(payload).select().single();
      if (error || !data) return null;
      return data;
    },
  };
}
