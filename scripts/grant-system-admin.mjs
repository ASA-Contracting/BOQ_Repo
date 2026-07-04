import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(name) {
  const env = fs.readFileSync(".env.local", "utf8");
  const match = env.match(new RegExp(`^${name}=(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
}

const email = process.argv[2] ?? "tamim@tamim.com";
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

const existingRoles = Array.isArray(user.app_metadata?.roles)
  ? user.app_metadata.roles.filter((role) => typeof role === "string")
  : [];

const roles = [...new Set([...existingRoles, "system_administrator"])];

const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
  user.id,
  { app_metadata: { ...user.app_metadata, roles } },
);

if (updateError) {
  console.log("UPDATE_FAIL");
  console.log(updateError.message);
  process.exit(1);
}

console.log("GRANTED: system_administrator");
console.log("EMAIL:", updated.user?.email ?? email);
console.log("USER_ID:", updated.user?.id ?? user.id);
console.log("ROLES:", JSON.stringify(roles));
