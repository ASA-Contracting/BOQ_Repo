/**
 * Times pricing pivot DB load directly (no HTTP/auth).
 * Usage: npx tsx --env-file=.env.local scripts/benchmark-pricing-pivot-db.ts
 */
import { eq } from "drizzle-orm";

import { loadMaterialNodesForTreeIndex } from "@/infrastructure/persistence/classification/loadMaterialNodesForTreeIndex";
import { getDb } from "@/infrastructure/persistence/db";
import { DrizzlePricingPivotRepository } from "@/infrastructure/persistence/reporting/DrizzlePricingPivotRepository";
import { materialNodes } from "@/drizzle/schema/classification";
import { boqItems } from "@/drizzle/schema";

async function main() {
  const db = getDb();
  const repo = new DrizzlePricingPivotRepository();

  const pivotStart = performance.now();
  const dataset = await repo.listPricingPivotRows();
  const pivotMs = Math.round(performance.now() - pivotStart);

  const allActiveStart = performance.now();
  const allActive = await db
    .select({ id: materialNodes.id })
    .from(materialNodes)
    .where(eq(materialNodes.isActive, true));
  const allActiveMs = Math.round(performance.now() - allActiveStart);

  const seedRows = await db
    .selectDistinct({ materialNodeId: boqItems.MaterialNodeId })
    .from(boqItems)
    .where(eq(boqItems.IsDeleted, false));
  const seedIds = seedRows
    .map((row) => row.materialNodeId)
    .filter((id): id is number => id != null)
    .slice(0, 200);

  const targetedStart = performance.now();
  const targeted = await loadMaterialNodesForTreeIndex(db, seedIds);
  const targetedMs = Math.round(performance.now() - targetedStart);

  console.log("\nPricing pivot DB benchmark");
  console.log(`  Pivot rows:                    ${dataset.rowCount.toLocaleString()}`);
  console.log(`  listPricingPivotRows:          ${pivotMs} ms`);
  console.log(`  Full active material nodes:    ${allActive.length.toLocaleString()} (${allActiveMs} ms)`);
  console.log(`  Targeted ancestor nodes:       ${targeted.length.toLocaleString()} (${targetedMs} ms, ${seedIds.length} seeds)`);
  console.log(
    `  Node scan reduction:           ${allActive.length > 0 ? Math.round((1 - targeted.length / allActive.length) * 100) : 0}%`,
  );
  console.log("");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
