import fs from "node:fs";
import { execFileSync } from "node:child_process";

const ENV_FILE = ".env.local";
const TARGETS = ["production", "preview", "development"];
const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_JWKS_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "DATABASE_URL",
];

function readEnvFile(path) {
  const content = fs.readFileSync(path, "utf8");
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    vars[key] = value.replace(/^["']|["']$/g, "");
  }

  return vars;
}

function addEnvVar(key, value, target) {
  execFileSync(
    "npx",
    ["vercel", "env", "add", key, target, "--force"],
    {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    },
  );
}

if (!fs.existsSync(ENV_FILE)) {
  console.log(`Missing ${ENV_FILE}`);
  process.exit(1);
}

const vars = readEnvFile(ENV_FILE);
const missing = KEYS.filter((key) => !vars[key]);

if (missing.length > 0) {
  console.log("MISSING_KEYS");
  console.log(missing.join(", "));
  process.exit(1);
}

console.log("Syncing environment variables to Vercel...");
console.log("Run `npx vercel login` first if prompted.");

for (const key of KEYS) {
  for (const target of TARGETS) {
    console.log(`→ ${key} (${target})`);
    addEnvVar(key, vars[key], target);
  }
}

console.log("DONE");
console.log("Redeploy from the Vercel dashboard to apply the new variables.");
