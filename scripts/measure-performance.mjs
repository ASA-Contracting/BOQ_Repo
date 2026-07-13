#!/usr/bin/env node
/**
 * Route TTFB + optional bundle size snapshot.
 * Usage: node scripts/measure-performance.mjs [--base http://localhost:3000]
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

const routes = ["/login", "/boq", "/boq/import", "/reports/pricing", "/dev/performance"];

async function measureRoute(path) {
  const url = `${base}${path}`;
  const start = performance.now();
  const response = await fetch(url, { redirect: "manual" });
  const elapsed = Math.round(performance.now() - start);
  return { path, status: response.status, ms: elapsed };
}

function topChunks(limit = 15) {
  const chunksDir = join(process.cwd(), ".next", "static", "chunks");
  try {
    return readdirSync(chunksDir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => {
        const full = join(chunksDir, name);
        return { name, kb: Math.round(statSync(full).size / 1024) };
      })
      .sort((a, b) => b.kb - a.kb)
      .slice(0, limit);
  } catch {
    return [];
  }
}

console.log(`\nPerformance snapshot — ${new Date().toISOString()}`);
console.log(`Base URL: ${base}\n`);

console.log("Route TTFB:");
for (const route of routes) {
  try {
    const result = await measureRoute(route);
    console.log(`  ${result.path.padEnd(22)} ${result.status}  ${result.ms} ms`);
  } catch (error) {
    console.log(`  ${route.padEnd(22)} ERR   ${error instanceof Error ? error.message : error}`);
  }
}

const chunks = topChunks();
if (chunks.length > 0) {
  console.log("\nTop client chunks (production build):");
  for (const chunk of chunks) {
    console.log(`  ${String(chunk.kb).padStart(5)} KB  ${chunk.name}`);
  }
}

console.log("");
