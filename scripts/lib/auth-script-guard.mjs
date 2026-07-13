/**
 * Guardrails for local scripts that touch Supabase Auth.
 *
 * Verification scripts must NEVER mutate user passwords. Use TEST_USER_EMAIL +
 * TEST_USER_PASSWORD from .env.local for browser login instead.
 *
 * Intentional password resets require ALLOW_PASSWORD_MUTATION=1 and --confirm.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PASSWORD_MUTATION_BLOCKED =
  "BLOCKED: Supabase Auth password mutation is forbidden here. " +
  "Verification scripts must use TEST_USER_PASSWORD from .env.local. " +
  "For intentional resets, run scripts/reset-user-password.mjs with " +
  "ALLOW_PASSWORD_MUTATION=1 and --confirm.";

export function loadEnvLocal(cwd = process.cwd()) {
  const path = resolve(cwd, ".env.local");
  if (!existsSync(path)) {
    return {};
  }

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

export function requireTestUserCredentials(env) {
  const email = env.TEST_USER_EMAIL?.trim();
  const password = env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local. " +
        "Verification scripts must never overwrite real user passwords.",
    );
  }

  return { email, password };
}

export function assertPasswordMutationAllowed(context = "This script") {
  const allowed = process.env.ALLOW_PASSWORD_MUTATION === "1";
  const confirmed = process.argv.includes("--confirm");

  if (allowed && confirmed) {
    return;
  }

  console.error(`${context} cannot mutate Supabase Auth passwords without explicit consent.`);
  console.error("Required:");
  console.error("  1. ALLOW_PASSWORD_MUTATION=1 in the environment");
  console.error("  2. --confirm on the command line");
  console.error("");
  console.error("PowerShell example:");
  console.error(
    "  $env:ALLOW_PASSWORD_MUTATION='1'; npx tsx --env-file=.env.local scripts/reset-user-password.mjs user@example.com 'NewPass123!' --confirm",
  );
  process.exit(1);
}

function guardAuthPayload(payload, allowPasswordMutation) {
  if (allowPasswordMutation || payload == null || typeof payload !== "object") {
    return;
  }

  if ("password" in payload && payload.password !== undefined) {
    throw new Error(PASSWORD_MUTATION_BLOCKED);
  }
}

export function createGuardedAdminClient(
  url,
  serviceRoleKey,
  { allowPasswordMutation = false } = {},
) {
  const client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const admin = client.auth.admin;
  const originalUpdateUserById = admin.updateUserById.bind(admin);
  const originalCreateUser = admin.createUser.bind(admin);

  admin.updateUserById = async (userId, attributes) => {
    guardAuthPayload(attributes, allowPasswordMutation);
    return originalUpdateUserById(userId, attributes);
  };

  admin.createUser = async (attributes) => {
    guardAuthPayload(attributes, allowPasswordMutation);
    return originalCreateUser(attributes);
  };

  return client;
}

export async function loginTestUserViaForm(page, options) {
  const {
    baseUrl,
    supabaseUrl,
    serviceRoleKey,
    env,
    loginPath = "/login",
    timeoutMs = 30_000,
  } = options;

  const { email, password } = requireTestUserCredentials(env);
  const admin = createGuardedAdminClient(supabaseUrl, serviceRoleKey);

  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    throw listError;
  }

  const user = (users.users ?? []).find(
    (row) => row.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    throw new Error(`Auth user not found for TEST_USER_EMAIL: ${email}`);
  }

  await page.goto(`${baseUrl}${loginPath}`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith(loginPath), {
    timeout: timeoutMs,
  });
}
