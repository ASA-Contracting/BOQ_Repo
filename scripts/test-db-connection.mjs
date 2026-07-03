import fs from "node:fs";
import postgres from "postgres";

function readDatabaseUrl() {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(/^DATABASE_URL=(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

async function probe(label, options) {
  const sql = postgres(options);
  try {
    await sql`select 1 as ok`;
    console.log(`${label}: OK`);
    return true;
  } catch (error) {
    console.log(`${label}: FAIL`);
    console.log((error instanceof Error ? error.message : String(error)).slice(0, 300));
    return false;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

const configuredUrl = readDatabaseUrl();
if (!configuredUrl) {
  console.log("NO_DATABASE_URL");
  process.exit(1);
}

await probe("DB_CONNECT_URL", configuredUrl);

const parsed = new URL(configuredUrl);
const password = decodeURIComponent(parsed.password);
const projectRef = "lzfnluxdwmzqbpzxnige";
const regions = [
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
  "ap-south-1",
];

for (const region of regions) {
  const poolerUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const ok = await probe(`DB_CONNECT_POOLER_${region}`, poolerUrl);
  if (ok) {
    break;
  }
}
