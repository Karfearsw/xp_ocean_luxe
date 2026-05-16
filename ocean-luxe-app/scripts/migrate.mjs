import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../../db/migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function listMigrationFiles() {
  const entries = await fs.readdir(migrationsDir);
  return entries.filter((name) => name.endsWith(".sql")).sort((a, b) => a.localeCompare(b));
}

async function hasMigration(client, id) {
  const { rows } = await client.query(`select id from public.schema_migrations where id = $1`, [id]);
  return rows.length > 0;
}

async function applyMigrationFile(client, filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(fullPath, "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query(`insert into public.schema_migrations (id) values ($1)`, [filename]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const files = await listMigrationFiles();
    for (const file of files) {
      const already = await hasMigration(client, file);
      if (already) continue;
      await applyMigrationFile(client, file);
      process.stdout.write(`applied ${file}\n`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
