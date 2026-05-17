import { Pool } from "pg";

declare global {
  var __oceanLuxePool: Pool | undefined;
  var __oceanLuxeDbReady: Promise<void> | undefined;
}

export function resolveDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || null;
}

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function assertValidDatabaseUrl(url: string) {
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      "Invalid DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL: must start with postgres:// or postgresql://"
    );
  }
}

export function getPool() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    if (isProductionRuntime()) {
      throw new Error("Missing DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL for production runtime.");
    }
    throw new Error("Missing DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL.");
  }

  assertValidDatabaseUrl(connectionString);

  if (!globalThis.__oceanLuxePool) {
    globalThis.__oceanLuxePool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: isProductionRuntime() ? { rejectUnauthorized: false } : undefined,
    });
  }

  return globalThis.__oceanLuxePool;
}

export async function ensureDbReady() {
  if (!globalThis.__oceanLuxeDbReady) {
    globalThis.__oceanLuxeDbReady = (async () => {
      const pool = getPool();
      await pool.query("select 1");
      const requiredTables = [
        "resorts",
        "packages",
        "bookings",
        "crm_sync_queue",
        "stripe_webhook_events",
        "availability_blocks",
        "customers",
        "media_assets",
        "room_types",
        "resort_amenities",
        "car_types",
        "concierge_services",
        "payments",
      ];
      const { rows } = await pool.query(
        `select table_name
         from information_schema.tables
         where table_schema = 'public' and table_name = any($1::text[])`,
        [requiredTables]
      );
      const present = new Set(rows.map((r: { table_name: string }) => r.table_name));
      const missing = requiredTables.filter((name) => !present.has(name));
      if (missing.length) {
        throw new Error(`Database schema missing required tables: ${missing.join(", ")}`);
      }
    })();
  }
  return globalThis.__oceanLuxeDbReady;
}
