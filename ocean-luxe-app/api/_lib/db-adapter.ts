/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PoolClient } from "pg";
import { ensureDbReady, getPool, isProductionRuntime, resolveDatabaseUrl } from "./neon-db.js";

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
  getActiveResorts(destination?: string): Promise<any[]>;
  getResortWithPackages(slug: string): Promise<{ resort: any; packages: any[] } | null>;
  getResortPublicDetail(
    slug: string
  ): Promise<{ resort: any; packages: any[]; room_types: any[]; amenities: any[]; media_assets: any[] } | null>;
  searchAvailableBlocks(filters: { resortId?: string; startDate?: string; endDate?: string }): Promise<any[]>;
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

function buildUpdatePatch(patch: Record<string, QueryValue>, allowed: string[]) {
  const keys = Object.keys(patch).filter((key) => allowed.includes(key));
  if (!keys.length) return null;
  const values = keys.map((key) => patch[key]);
  const sql = keys.map((key, idx) => `"${key}" = $${idx + 1}`).join(", ");
  return { values, sql };
}

async function withTx<T>(fn: (client: PoolClient) => Promise<T>) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function getDbAdapter(): DbAdapter | null {
  if (!resolveDatabaseUrl()) {
    if (isProductionRuntime()) {
      throw new Error("Missing DATABASE_URL for production runtime.");
    }
    if (process.env.ALLOW_OFFLINE_MODE === "true") return null;
    throw new Error("Missing DATABASE_URL.");
  }

  return {
    async getActiveResorts(destination) {
      await ensureDbReady();
      const pool = getPool();
      const params: any[] = [];
      let where = `where active = true and is_published = true`;
      if (destination) {
        params.push(destination);
        where += ` and destination = $${params.length}`;
      }
      const { rows } = await pool.query(`select * from resorts ${where} order by name asc`, params);
      return rows;
    },

    async getResortWithPackages(slug) {
      await ensureDbReady();
      const pool = getPool();
      const resortResult = await pool.query(`select * from resorts where slug = $1 and active = true limit 1`, [slug]);
      const resort = resortResult.rows[0];
      if (!resort) return null;
      const packagesResult = await pool.query(`select * from packages where resort_id = $1 and active = true order by public_price asc`, [
        resort.id,
      ]);
      return { resort, packages: packagesResult.rows };
    },

    async getResortPublicDetail(slug) {
      await ensureDbReady();
      const pool = getPool();
      const resortResult = await pool.query(
        `select * from resorts where slug = $1 and active = true and is_published = true limit 1`,
        [slug]
      );
      const resort = resortResult.rows[0];
      if (!resort) return null;
      const [packagesResult, roomTypesResult, amenitiesResult, mediaResult] = await Promise.all([
        pool.query(`select * from packages where resort_id = $1 and active = true order by public_price asc`, [resort.id]),
        pool.query(
          `select * from room_types where resort_id = $1 and is_active = true order by max_occupancy asc, name asc`,
          [resort.id]
        ),
        pool.query(
          `select * from resort_amenities where resort_id = $1 order by category asc, sort_order asc, label asc`,
          [resort.id]
        ),
        pool.query(
          `select * from media_assets where resort_id = $1 order by is_primary desc, sort_order asc, created_at asc`,
          [resort.id]
        ),
      ]);
      return {
        resort,
        packages: packagesResult.rows,
        room_types: roomTypesResult.rows,
        amenities: amenitiesResult.rows,
        media_assets: mediaResult.rows,
      };
    },

    async searchAvailableBlocks(filters) {
      await ensureDbReady();
      const pool = getPool();
      const params: any[] = [];
      let where = `where status = 'available'`;
      if (filters.resortId) {
        params.push(filters.resortId);
        where += ` and resort_id = $${params.length}`;
      }
      if (filters.startDate) {
        params.push(filters.startDate);
        where += ` and start_date >= $${params.length}`;
      }
      if (filters.endDate) {
        params.push(filters.endDate);
        where += ` and end_date <= $${params.length}`;
      }
      const { rows } = await pool.query(`select * from availability_blocks ${where} order by start_date asc`, params);
      return rows;
    },

    async getBookingById(bookingId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(`select * from bookings where id = $1 limit 1`, [bookingId]);
      return rows[0] ?? null;
    },

    async getPackagePricing(packageId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(
        `select payment_mode, deposit_amount, public_price, guest_certificate_fee, base_cost, markup_amount
         from packages where id = $1 limit 1`,
        [packageId]
      );
      return rows[0] ?? null;
    },

    async markBooking(bookingId, patch) {
      await ensureDbReady();
      const pool = getPool();
      const update = buildUpdatePatch(patch, [
        "payment_status",
        "booking_status",
        "stripe_payment_intent_id",
        "crm_sync_status",
        "email_status",
        "provider_confirmation_number",
      ]);
      if (!update) return this.getBookingById(bookingId);
      const { rows } = await pool.query(
        `update bookings set ${update.sql} where id = $${update.values.length + 1} returning *`,
        [...update.values, bookingId]
      );
      return rows[0] ?? null;
    },

    async insertStripeWebhookEvent(payload) {
      await ensureDbReady();
      const pool = getPool();
      const { rowCount } = await pool.query(
        `insert into stripe_webhook_events (stripe_event_id, event_type, payload, processed_at)
         values ($1, $2, $3::jsonb, $4)
         on conflict (stripe_event_id) do nothing`,
        [payload.stripe_event_id, payload.event_type, JSON.stringify(payload.payload), payload.processed_at]
      );
      if (rowCount === 0) return "duplicate";
      return null;
    },

    async enqueueCrmJobs(payload) {
      await ensureDbReady();
      const pool = getPool();
      if (!payload.length) return;
      const values: any[] = [];
      const rowsSql = payload
        .map((job, idx) => {
          const base = idx * 3;
          values.push(job.booking_id ?? null, job.destination ?? "crm_rest", JSON.stringify(job.payload ?? {}));
          return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb)`;
        })
        .join(", ");
      await pool.query(`insert into crm_sync_queue (booking_id, destination, payload) values ${rowsSql}`, values);
    },

    async listPendingSyncJobs(limit) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(
        `select * from crm_sync_queue
         where status in ('pending','failed')
           and next_attempt_at <= now()
         order by created_at asc
         limit $1`,
        [limit]
      );
      return rows;
    },

    async patchSyncJob(jobId, patch) {
      await ensureDbReady();
      const pool = getPool();
      const update = buildUpdatePatch(patch as Record<string, QueryValue>, [
        "status",
        "locked_at",
        "sent_at",
        "last_error",
        "attempt_count",
        "next_attempt_at",
      ]);
      if (!update) return;
      await pool.query(
        `update crm_sync_queue set ${update.sql} where id = $${update.values.length + 1}`,
        [...update.values, jobId]
      );
    },

    async getActivePackageById(packageId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(
        `select id, resort_id, base_cost, public_price, payment_mode, deposit_amount, active, guest_certificate_fee, markup_amount
         from packages where id = $1 and active = true limit 1`,
        [packageId]
      );
      return rows[0] ?? null;
    },

    async lockAvailability(packageId, startDate, endDate) {
      await ensureDbReady();
      return withTx(async (client) => {
        const { rows } = await client.query(
          `select id
           from availability_blocks
           where package_id = $1
             and status = 'available'
             and start_date <= $2
             and end_date >= $3
           order by start_date asc
           limit 1
           for update skip locked`,
          [packageId, startDate, endDate]
        );
        const block = rows[0];
        if (!block) return false;
        await client.query(`update availability_blocks set status = 'held', updated_at = now() where id = $1`, [block.id]);
        return true;
      });
    },

    async upsertCustomer(payload) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(
        `insert into customers (email, full_name, phone)
         values ($1, $2, $3)
         on conflict (email)
         do update set full_name = excluded.full_name, phone = excluded.phone, updated_at = now()
         returning *`,
        [payload.email, payload.full_name, payload.phone]
      );
      return rows[0] ?? null;
    },

    async createBooking(payload) {
      await ensureDbReady();
      const pool = getPool();
      const cols = Object.keys(payload);
      const vals = cols.map((key) => (payload as any)[key]);
      const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(", ");
      const sqlCols = cols.map((name) => `"${name}"`).join(", ");
      const { rows } = await pool.query(`insert into bookings (${sqlCols}) values (${placeholders}) returning *`, vals);
      return rows[0] ?? null;
    },
  };
}
