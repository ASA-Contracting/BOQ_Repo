import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL is not set");
  process.exit(1);
}

let host = "unknown";
try {
  host = new URL(databaseUrl).hostname;
} catch {
  console.error("FAIL: DATABASE_URL is not a valid URL");
  process.exit(1);
}

console.log("DATABASE_URL host:", host);

const parsedUrl = new URL(databaseUrl);
const poolPort = parsedUrl.port || "5432";
if (
  parsedUrl.hostname.endsWith(".pooler.supabase.com") &&
  poolPort === "5432"
) {
  console.warn(
    "\nWARN: DATABASE_URL uses Supabase Session pooler (:5432). App runtime needs Transaction pooler (:6543).",
  );
  console.warn(
    "      The app auto-upgrades this at runtime; set port 6543 in .env.local to avoid migrate/dev conflicts.",
  );
}

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

const expectedTables = [
  "Families",
  "FamilyLevelTypes",
  "BoqItems",
  "Projects",
  "Boqs",
  "BoqVersions",
  "AspNetUsers",
  "AuditTrails",
  "boq_work_batch",
  "boq_work_item",
  "boq_work_ai_analysis",
  "boq_work_ai_suggestion",
  "boq_work_review_action",
  "boq_work_export_batch",
  "boq_work_export_item",
  "boq_work_event_log",
];

try {
  const ping = await sql`select 1 as ok`;
  console.log("SELECT 1:", ping[0]?.ok === 1 ? "ok" : ping[0]);

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;
  const names = new Set(tables.map((row) => row.table_name));

  console.log("\nExisting public tables:", tables.length);
  for (const row of tables) {
    console.log("  -", row.table_name);
  }
  for (const name of expectedTables) {
    console.log(`  ${names.has(name) ? "OK" : "MISSING"} ${name}`);
  }

  const migrationRows = await sql`
    select id, hash, created_at
    from drizzle.__drizzle_migrations
    order by created_at
  `.catch(async (error) => {
    console.log("\nMigration history: unavailable (" + error.message + ")");
    return [];
  });

  if (migrationRows.length > 0) {
    console.log("\nMigration history:");
    for (const row of migrationRows) {
      console.log(`  - id=${row.id} created_at=${row.created_at} hash=${row.hash ?? "n/a"}`);
    }
  }

  if (names.has("Families")) {
    const families = await sql`select count(*)::int as count from "Families"`;
    console.log("\nFamilies count:", families[0]?.count);
  }

  if (names.has("FamilyLevelTypes")) {
    const levelTypes =
      await sql`select count(*)::int as count from "FamilyLevelTypes"`;
    console.log("FamilyLevelTypes count:", levelTypes[0]?.count);
  }

  if (names.has("Families")) {
    await sql`
      select "Id", "Name", "ReferenceCode", "Description", "FamilyLevelTypeId", "ParentId"
      from "Families"
      order by "Name" asc
      limit 5
    `;
    console.log("findAllFlat query: ok");
  }
} catch (error) {
  console.error("\nFAIL:", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
