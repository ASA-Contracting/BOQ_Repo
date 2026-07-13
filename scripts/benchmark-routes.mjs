#!/usr/bin/env node
/**
 * Authenticated route + API benchmarks (uses TEST_USER_* from .env.local).
 * Usage: node scripts/benchmark-routes.mjs
 */
import { chromium } from "playwright";
import { loadEnvLocal, loginTestUserViaForm } from "./lib/auth-script-guard.mjs";

const baseUrl = "http://localhost:3000";
const env = { ...loadEnvLocal(), ...process.env };

async function timeNavigation(page, path, waitUntil = "domcontentloaded") {
  const start = performance.now();
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil,
    timeout: 60_000,
  });
  const ms = Math.round(performance.now() - start);
  return { path, status: response?.status() ?? 0, ms };
}

async function timeApi(page, path) {
  const start = performance.now();
  const result = await page.evaluate(async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return { status: res.status, bytes: text.length };
  }, `${baseUrl}${path}`);
  return { path, ...result, ms: Math.round(performance.now() - start) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await loginTestUserViaForm(page, {
    baseUrl,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    env,
  });

  const routes = ["/boq", "/reports/pricing", "/families", "/settings/users"];
  console.log("\nAuthenticated navigation (domcontentloaded):");
  for (const path of routes) {
    const result = await timeNavigation(page, path);
    console.log(`  ${result.path.padEnd(22)} ${result.status}  ${result.ms} ms`);
  }

  console.log("\nAuthenticated API:");
  const apis = [
    "/api/reporting/pricing-pivot",
    "/api/boq/lookups?category=discipline",
    "/api/reporting/analytics",
  ];
  for (const path of apis) {
    const result = await timeApi(page, path);
    const kb = Math.round(result.bytes / 1024);
    console.log(
      `  ${result.path.padEnd(36)} ${result.status}  ${result.ms} ms  ${kb} KB`,
    );
  }

  const boqLink = page.locator('a[href^="/boq/"]').first();
  if (await boqLink.count()) {
    const href = await boqLink.getAttribute("href");
    if (href) {
      const result = await timeNavigation(page, href);
      console.log("\nFirst BOQ breakdown:");
      console.log(`  ${result.path.padEnd(22)} ${result.status}  ${result.ms} ms`);
    }
  }

  await browser.close();
  console.log("");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
