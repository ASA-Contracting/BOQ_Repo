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
  const users = await sql`
    select id, email
    from auth.users
    where email = ${email}
    limit 1
  `;

  if (users.length === 0) {
    console.log("AUTH_USER: NOT_FOUND");
    process.exit(1);
  }

  const userId = users[0].id;

  await sql`
    insert into profiles (id, email)
    values (${userId}, ${email})
    on conflict (id) do update set email = excluded.email
  `;

  const existingRole = await sql`
    select id from user_roles where user_id = ${userId} limit 1
  `;

  if (existingRole.length === 0) {
    await sql`
      insert into user_roles (user_id, role)
      values (${userId}, 'viewer')
    `;
  }

  console.log("PROFILE: OK");
  console.log("ROLE: viewer");
  console.log("USER_ID:", userId);
} catch (error) {
  console.log("SETUP: FAIL");
  console.log((error instanceof Error ? error.message : String(error)).slice(0, 400));
  process.exit(1);
} finally {
  await sql.end({ timeout: 1 });
}
