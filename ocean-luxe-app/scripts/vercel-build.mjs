import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const vercelEnv = process.env.VERCEL_ENV;
const autoApply = process.env.AUTO_APPLY_MIGRATIONS === "true";

if (vercelEnv === "preview" && autoApply) {
  run("node", ["scripts/migrate.mjs"]);
}

run("npm", ["run", "build"]);
