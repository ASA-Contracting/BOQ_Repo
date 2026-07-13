/**
 * Fails CI/local checks if verification scripts can mutate Supabase Auth passwords.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const scriptsDir = join(process.cwd(), "scripts");
const guardedScriptNames = new Set(["reset-user-password.mjs"]);

const forbiddenPatterns = [
  {
    name: "admin updateUserById",
    regex: /\.auth\.admin\.updateUserById\b/,
  },
  {
    name: "admin createUser",
    regex: /\.auth\.admin\.createUser\b/,
  },
  {
    name: "tempPassword assignment",
    regex: /\btempPassword\s*=/,
  },
  {
    name: "generated verify-* login password",
    regex: /verify-\$\{Date\.now\(\)\}-Aa1!/,
  },
];

const failures = [];

for (const fileName of readdirSync(scriptsDir)) {
  if (guardedScriptNames.has(fileName)) {
    continue;
  }

  if (!fileName.startsWith("verify-") && !fileName.startsWith("diagnose-")) {
    continue;
  }

  if (!/\.(mjs|ts)$/.test(fileName)) {
    continue;
  }

  const filePath = join(scriptsDir, fileName);
  const content = readFileSync(filePath, "utf8");

  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      failures.push(`${fileName}: forbidden ${pattern.name}`);
    }
  }

  const usesGuardedAdminAuth =
    content.includes("auth.admin") || content.includes("loginViaForm");

  if (usesGuardedAdminAuth && !content.includes("auth-script-guard")) {
    failures.push(
      `${fileName}: Supabase Auth login scripts must import scripts/lib/auth-script-guard.mjs`,
    );
  }
}

if (failures.length > 0) {
  console.error("AUTH SCRIPT SAFETY CHECK FAILED");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("AUTH SCRIPT SAFETY CHECK OK");
