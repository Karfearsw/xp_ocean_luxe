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
  getResortOrlandoSupport(resortId: string): Promise<boolean | null>;
  isRoomTypeForResort(roomTypeId: string, resortId: string): Promise<boolean>;
  searchAvailableBlocks(filters: { resortId?: string; startDate?: string; endDate?: string }): Promise<any[]>;
  getBookingById(bookingId: string): Promise<any | null>;
  getPackagePricing(packageId: string): Promise<any | null>;
  getCarTypeById(carTypeId: string): Promise<any | null>;
  getConciergeServicesByIds(ids: string[]): Promise<any[]>;
  replaceBookingConciergeServices(
    bookingId: string,
    items: Array<{ concierge_service_id: string; service_name: string; base_fee: number; per_hour_rate: number }>
  ): Promise<void>;
  markBooking(bookingId: string, patch: Record<string, QueryValue>): Promise<any | null>;
  insertStripeWebhookEvent(payload: Record<string, unknown>): Promise<string | null>;
  enqueueCrmJobs(payload: Array<Record<string, unknown>>): Promise<void>;
  listPendingSyncJobs(limit: number): Promise<any[]>;
  patchSyncJob(jobId: string, patch: SyncJobPatch): Promise<void>;
  getActivePackageById(packageId: string): Promise<any | null>;
  lockAvailability(packageId: string, startDate: string, endDate: string, holdExpiresAt: string): Promise<string | null>;
  upsertCustomer(payload: { email: string; full_name: string; phone: string }): Promise<any | null>;
  createBooking(payload: Record<string, unknown>): Promise<any | null>;
  getAvailabilityBlockById(blockId: string): Promise<any | null>;
  extendAvailabilityHold(blockId: string, holdExpiresAt: string): Promise<void>;
  markAvailabilityBlockBooked(blockId: string): Promise<boolean>;
  upsertPayment(payload: {
    booking_id: string;
    stripe_payment_intent_id?: string | null;
    amount: number;
    status: string;
    paid_at?: string | null;
  }): Promise<void>;
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

    async getResortOrlandoSupport(resortId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(
        `select is_orlando_concierge_supported from resorts where id = $1 and active = true limit 1`,
        [resortId]
      );
      const value = rows[0]?.is_orlando_concierge_supported;
      if (typeof value !== "boolean") return null;
      return value;
    },

    async isRoomTypeForResort(roomTypeId, resortId) {
      await ensureDbReady();
      const pool = getPool();
      const { rowCount } = await pool.query(
        `select 1 from room_types where id = $1 and resort_id = $2 and is_active = true limit 1`,
        [roomTypeId, resortId]
      );
      return rowCount > 0;
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
      const { rows } = await pool.query(
        `select
           b.*,
           coalesce(
             (select array_agg(concierge_service_id order by service_name asc)
              from booking_concierge_services
              where booking_id = b.id),
             '{}'::uuid[]
           ) as concierge_service_ids,
           coalesce(
             (select sum(base_fee) from booking_concierge_services where booking_id = b.id),
             0
           ) as concierge_services_base_total
         from bookings b
         where b.id = $1
         limit 1`,
        [bookingId]
      );
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

    async getCarTypeById(carTypeId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(`select * from car_types where id = $1 and is_active = true limit 1`, [carTypeId]);
      return rows[0] ?? null;
    },

    async getConciergeServicesByIds(ids) {
      await ensureDbReady();
      if (!ids.length) return [];
      const pool = getPool();
      const { rows } = await pool.query(`select * from concierge_services where id = any($1::uuid[]) order by name asc`, [ids]);
      return rows;
    },

    async replaceBookingConciergeServices(bookingId, items) {
      await ensureDbReady();
      await withTx(async (client) => {
        await client.query(`delete from booking_concierge_services where booking_id = $1`, [bookingId]);
        if (!items.length) return;
        const values: any[] = [];
        const rowsSql = items
          .map((item, idx) => {
            const base = idx * 5;
            values.push(
              bookingId,
              item.concierge_service_id,
              item.service_name,
              item.base_fee,
              item.per_hour_rate
            );
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
          })
          .join(", ");
        await client.query(
          `insert into booking_concierge_services (booking_id, concierge_service_id, service_name, base_fee, per_hour_rate)
           values ${rowsSql}`,
          values
        );
      });
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
        "total_price",
        "deposit_amount",
        "due_now",
        "car_total",
        "concierge_total",
        "car_daily_rate",
        "car_cleaning_fee",
        "car_delivery_fee",
        "car_markup_percent",
        "balance_due",
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

    async lockAvailability(packageId, startDate, endDate, holdExpiresAt) {
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
        if (!block) return null;

        const { rows: currentRows } = await client.query(
          `select id, resort_id, package_id, start_date, end_date, source_type, notes
           from availability_blocks
           where id = $1
           limit 1
           for update`,
          [block.id]
        );
        const current = currentRows[0];
        if (!current) return null;

        const originalStart = String(current.start_date);
        const originalEnd = String(current.end_date);
        const originalSource = String(current.source_type ?? "admin");
        const originalNotes = typeof current.notes === "string" ? current.notes : null;

        await client.query(
          `update availability_blocks
           set start_date = $2,
               end_date = $3,
               status = 'held',
               source_type = 'booking',
               held_at = now(),
               hold_expires_at = $4,
               updated_at = now()
           where id = $1`,
          [block.id, startDate, endDate, holdExpiresAt]
        );

        if (Date.parse(originalStart) < Date.parse(startDate)) {
          await client.query(
            `insert into availability_blocks (resort_id, package_id, start_date, end_date, status, source_type, notes)
             values ($1, $2, $3::date, $4::date, 'available', $5::public.block_source_type, $6)`,
            [current.resort_id, current.package_id, originalStart, startDate, originalSource, originalNotes]
          );
        }

        if (Date.parse(endDate) < Date.parse(originalEnd)) {
          await client.query(
            `insert into availability_blocks (resort_id, package_id, start_date, end_date, status, source_type, notes)
             values ($1, $2, $3::date, $4::date, 'available', $5::public.block_source_type, $6)`,
            [current.resort_id, current.package_id, endDate, originalEnd, originalSource, originalNotes]
          );
        }

        return block.id as string;
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

    async getAvailabilityBlockById(blockId) {
      await ensureDbReady();
      const pool = getPool();
      const { rows } = await pool.query(`select * from availability_blocks where id = $1 limit 1`, [blockId]);
      return rows[0] ?? null;
    },

    async extendAvailabilityHold(blockId, holdExpiresAt) {
      await ensureDbReady();
      const pool = getPool();
      await pool.query(
        `update availability_blocks
         set hold_expires_at = $2,
             updated_at = now()
         where id = $1 and status = 'held'`,
        [blockId, holdExpiresAt]
      );
    },

    async markAvailabilityBlockBooked(blockId) {
      await ensureDbReady();
      const pool = getPool();
      const { rowCount } = await pool.query(
        `update availability_blocks
         set status = 'booked',
             hold_expires_at = null,
             updated_at = now()
         where id = $1 and status = 'held'`,
        [blockId]
      );
      return rowCount > 0;
    },

    async upsertPayment(payload) {
      await ensureDbReady();
      const pool = getPool();
      await pool.query(
        `insert into payments (booking_id, stripe_payment_intent_id, amount, status, paid_at)
         values ($1, $2, $3, $4, $5)
         on conflict (stripe_payment_intent_id)
         do update set amount = excluded.amount, status = excluded.status, paid_at = excluded.paid_at, updated_at = now()`,
        [
          payload.booking_id,
          payload.stripe_payment_intent_id ?? null,
          payload.amount,
          payload.status,
          payload.paid_at ?? null,
        ]
      );
    },
  };
}
