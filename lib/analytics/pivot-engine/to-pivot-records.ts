import type { PricingPivotRow } from "@/domain/reporting/PricingPivotRow";
import type { PivotRecord } from "@/lib/analytics/pivot-engine/types";

/** Maps domain pricing rows to pivot-engine records (server or client). */
export function toPivotRecords(rows: PricingPivotRow[]): PivotRecord[] {
  return rows.map((row) => ({
    Project: row.projectName,
    Country: row.country,
    Client: row.client,
    "Tender status": row.tenderStatus,
    BOQ: row.boqName,
    Discipline: row.discipline,
    Version: row.versionName,
    "Category path": row.categoryPath,
    Category: row.categoryLabel,
    Family: row.familyName,
    Classification: row.classificationStatus,
    Unit: row.unit,
    Quantity: row.quantity ?? 0,
    "Unit rate": row.unitRate ?? 0,
    "Total sale": row.totalSale ?? 0,
    Description: row.description,
  }));
}
