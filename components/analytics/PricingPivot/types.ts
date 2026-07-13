import type { PivotRecord } from "@/lib/analytics/pivot-engine/types";
import { toPivotRecords as mapDomainRowsToPivotRecords } from "@/lib/analytics/pivot-engine/to-pivot-records";

export type PricingPivotApiRow = {
  projectName: string;
  country: string;
  client: string;
  tenderStatus: string;
  boqName: string;
  discipline: string;
  versionName: string;
  categoryPath: string;
  categoryLabel: string;
  familyName: string;
  classificationStatus: string;
  unit: string;
  quantity: number | null;
  unitRate: number | null;
  totalSale: number | null;
  description: string;
};

export type PricingPivotDataset = {
  rows: PricingPivotApiRow[];
  rowCount: number;
};

export function toPivotRecordsFromApi(rows: PricingPivotApiRow[]): PivotRecord[] {
  return mapDomainRowsToPivotRecords(
    rows.map((row) => ({
      projectName: row.projectName,
      country: row.country,
      client: row.client,
      tenderStatus: row.tenderStatus,
      boqName: row.boqName,
      discipline: row.discipline,
      versionName: row.versionName,
      categoryPath: row.categoryPath,
      categoryLabel: row.categoryLabel,
      familyName: row.familyName,
      classificationStatus:
        row.classificationStatus === "Categorized" ? "Categorized" : "Uncategorized",
      unit: row.unit,
      quantity: row.quantity,
      unitRate: row.unitRate,
      totalSale: row.totalSale,
      description: row.description,
    })),
  );
}

/** @deprecated Server computes pivot — kept for CSV export compatibility. */
export function toPivotRecords(rows: PricingPivotApiRow[]): PivotRecord[] {
  return toPivotRecordsFromApi(rows);
}

export function exportPivotCsv(
  headers: string[],
  bodyRows: string[][],
  filename = "pricing-pivot.csv",
): void {
  const escape = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const lines = [
    headers.map(escape).join(","),
    ...bodyRows.map((row) => row.map((cell) => escape(cell)).join(",")),
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
