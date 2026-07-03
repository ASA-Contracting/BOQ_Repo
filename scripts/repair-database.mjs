import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "FAIL: DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/repair-database.mjs",
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

try {
  const marker = await sql`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'Families'
  `;

  if ((marker[0]?.count ?? 0) > 0) {
    console.log('OK: "Families" exists — no repair needed.');
    process.exit(0);
  }

  const migrationRows =
    await sql`select id, hash from drizzle.__drizzle_migrations`;
  if (migrationRows.length === 0) {
    console.log(
      'Repair: "Families" missing and no migration history — run npm run db:migrate.',
    );
    process.exit(0);
  }

  console.log(
    `Repair: clearing ${migrationRows.length} stale migration record(s); schema was never applied.`,
  );
  await sql`delete from drizzle.__drizzle_migrations`;
  console.log("Done. Run npm run db:migrate to apply drizzle/migrations.");
} catch (error) {
  console.error("FAIL:", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
