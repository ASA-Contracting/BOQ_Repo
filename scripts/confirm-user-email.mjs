import fs from "node:fs";
import postgres from "postgres";

function readDatabaseUrl() {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(/^DATABASE_URL=(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

const databaseUrl = readDatabaseUrl();
if (!databaseUrl) {
  console.log("NO_DATABASE_URL");
  process.exit(1);
}

const email = "tamim@tamim.com";
const sql = postgres(databaseUrl, { max: 1 });

try {
  const rows = await sql`
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where email = ${email}
    returning id, email, email_confirmed_at
  `;

  if (rows.length === 0) {
    console.log("USER_NOT_FOUND");
    process.exit(1);
  }

  console.log("EMAIL_CONFIRMED: OK");
  console.log("USER_ID:", rows[0].id);
} catch (error) {
  console.log("EMAIL_CONFIRM: FAIL");
  console.log((error instanceof Error ? error.message : String(error)).slice(0, 400));
  process.exit(1);
} finally {
  await sql.end({ timeout: 1 });
}
