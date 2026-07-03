#!/usr/bin/env node
/**
 * Ensures DATABASE_URL in .env.local uses Supabase transaction pooler (:6543).
 * Run: node scripts/fix-database-url.mjs
 */

import fs from "node:fs";

const envPath = ".env.local";

if (!fs.existsSync(envPath)) {
  console.error("No .env.local found.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const match = content.match(/^DATABASE_URL=(.+)$/m);

if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

let url;
try {
  url = new URL(match[1].trim());
} catch {
  console.error("DATABASE_URL is not a valid URL");
  process.exit(1);
}

const port = url.port || "5432";
const isPooler = url.hostname.endsWith(".pooler.supabase.com");

console.log("Host:", url.hostname);
console.log("Port:", port);

if (!isPooler) {
  console.log("OK: not a Supabase pooler URL — no change needed.");
  process.exit(0);
}

if (port === "6543") {
  console.log("OK: already using transaction pooler (:6543).");
  process.exit(0);
}

url.port = "6543";
const updated = content.replace(
  /^DATABASE_URL=.+$/m,
  `DATABASE_URL=${url.toString()}`,
);

fs.writeFileSync(envPath, updated);
console.log("Fixed: DATABASE_URL port updated to 6543 (transaction pooler).");
console.log("Restart the dev server: npm run dev");
