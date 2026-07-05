import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(name) {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(new RegExp(`^${name}=(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("USAGE: node scripts/reset-user-password.mjs <email> <password>");
  process.exit(1);
}

const url =
  readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey =
  readEnv("SUPABASE_SECRET_KEY") ?? readEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !secretKey) {
  console.log("MISSING_SUPABASE_ADMIN_CONFIG");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.log("LIST_USERS_FAIL");
  console.log(listError.message);
  process.exit(1);
}

const user = (data.users ?? []).find(
  (entry) => entry.email?.toLowerCase() === email.toLowerCase(),
);

if (!user) {
  console.log("USER_NOT_FOUND");
  console.log(email);
  process.exit(1);
}

const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
  user.id,
  { password },
);

if (updateError) {
  console.log("UPDATE_FAIL");
  console.log(updateError.message);
  process.exit(1);
}

console.log("PASSWORD_UPDATED: OK");
console.log("EMAIL:", updated.user?.email ?? email);
console.log("USER_ID:", updated.user?.id ?? user.id);
