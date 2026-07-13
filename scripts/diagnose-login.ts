import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return {};
  const env: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = { ...loadEnvLocal(), ...process.env };
const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE_URL set:", Boolean(url));
console.log("PUBLISHABLE_KEY set:", Boolean(publishableKey));
console.log("SECRET_KEY set:", Boolean(serviceKey));

if (!url || !publishableKey) {
  console.log("DIAGNOSIS: Supabase auth env vars missing — login form will show 'not configured'.");
  process.exit(1);
}

const testEmail = process.argv[2] ?? "tamim@tamim.com";
const testPassword = process.argv[3];

if (!testPassword) {
  console.log("Usage: npx tsx --env-file=.env.local scripts/diagnose-login.ts <email> <password>");
  console.log("DIAGNOSIS: Provide your email + password to test sign-in (password is not logged).");
  process.exit(1);
}

const anon = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await anon.auth.signInWithPassword({
  email: testEmail,
  password: testPassword,
});

if (error) {
  console.log("SIGN_IN: FAILED");
  console.log("ERROR_CODE:", error.code ?? "unknown");
  console.log("ERROR_MESSAGE:", error.message);
  process.exit(1);
}

console.log("SIGN_IN: OK");
console.log("USER_EMAIL:", data.user?.email ?? "unknown");
console.log(
  "MUST_CHANGE_PASSWORD:",
  data.user?.user_metadata?.must_change_password === true,
);
