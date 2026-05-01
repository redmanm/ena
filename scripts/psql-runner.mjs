import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotenv(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// Prefer local env files in this order.
const repoRoot = process.cwd();
loadDotenv(path.join(repoRoot, ".env.local"));
loadDotenv(path.join(repoRoot, ".env"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local or .env.");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/psql-runner.mjs <sql-file>");
  process.exit(1);
}

const sqlPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(repoRoot, sqlFile);
const result = spawnSync("psql", [databaseUrl, "-f", sqlPath], {
  stdio: "inherit",
  windowsHide: true,
});

process.exit(result.status ?? 1);
