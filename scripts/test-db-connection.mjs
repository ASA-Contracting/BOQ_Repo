import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
  console.log("RESULT: missing DATABASE_URL");
  process.exit(1);
}

let host = "unknown";
try {
  const parsed = new URL(databaseUrl);
  host = `${parsed.hostname}:${parsed.port || "5432"}`;
} catch {
  console.log("RESULT: invalid DATABASE_URL");
  process.exit(1);
}

console.log("TARGET:", host);

const sql = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  connect_timeout: 10,
});

try {
  const [{ ok }] = await sql`select 1 as ok`;
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('BoqVersions', 'Boqs', 'Projects', 'boq_work_batch')
    order by table_name
  `;
  console.log("CONNECT: ok", ok);
  console.log("TABLES:", tables.map((row) => row.table_name).join(", ") || "none");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "code" in error ? error.code : "unknown";
  console.log("CONNECT: failed");
  console.log("CODE:", code);
  console.log("MESSAGE:", message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
