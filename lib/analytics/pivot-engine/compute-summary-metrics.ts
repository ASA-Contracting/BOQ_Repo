import type { PivotRecord, PivotSummaryMetrics } from "@/lib/analytics/pivot-engine/types";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function distinctCount(data: PivotRecord[], field: string): number {
  return new Set(data.map((row) => String(row[field] ?? ""))).size;
}

export function computeSummaryMetrics(data: PivotRecord[]): PivotSummaryMetrics {
  const rates = data
    .map((row) => row["Unit rate"])
    .filter((value): value is number => typeof value === "number" && value > 0);

  const averageRate =
    rates.length === 0
      ? null
      : rates.reduce((sum, value) => sum + value, 0) / rates.length;

  return {
    averageRate,
    medianRate: median(rates),
    highestRate: rates.length === 0 ? null : Math.max(...rates),
    lowestRate: rates.length === 0 ? null : Math.min(...rates),
    projectCount: distinctCount(data, "Project"),
    categoryCount: distinctCount(data, "Category path"),
    familyCount: distinctCount(data, "Family"),
    itemCount: data.length,
    pricedItemCount: rates.length,
  };
}
