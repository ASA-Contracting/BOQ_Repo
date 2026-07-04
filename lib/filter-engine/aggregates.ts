import type { FilterColumnDef } from "./types";

export type AggregateOperation = "count" | "sum" | "avg" | "min" | "max" | "distinct";

export const AGGREGATE_OPERATIONS: AggregateOperation[] = [
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "distinct",
];

export const AGGREGATE_LABELS: Record<AggregateOperation, string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  distinct: "Distinct count",
};

function getCellValue<T>(row: T, column: FilterColumnDef<T>): unknown {
  if (column.getValue) return column.getValue(row);
  return (row as Record<string, unknown>)[column.field];
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isNumericAggregateColumn<T>(column: FilterColumnDef<T>): boolean {
  return column.filterType === "number";
}

export function operationsForColumn<T>(column: FilterColumnDef<T>): AggregateOperation[] {
  if (isNumericAggregateColumn(column)) {
    return AGGREGATE_OPERATIONS;
  }
  return ["count", "distinct"];
}

export function calculateAggregate<T>(
  rows: T[],
  column: FilterColumnDef<T>,
  operation: AggregateOperation,
): number {
  if (operation === "count") {
    return rows.length;
  }

  const values = rows
    .map((row) => getCellValue(row, column))
    .map((value) => (operation === "distinct" ? String(value ?? "").trim() : parseNumeric(value)));

  if (operation === "distinct") {
    return new Set(values.filter(Boolean)).size;
  }

  const numerics = values.filter((value): value is number => typeof value === "number");
  if (numerics.length === 0) return 0;

  switch (operation) {
    case "sum":
      return numerics.reduce((sum, value) => sum + value, 0);
    case "avg":
      return numerics.reduce((sum, value) => sum + value, 0) / numerics.length;
    case "min":
      return Math.min(...numerics);
    case "max":
      return Math.max(...numerics);
    default:
      return rows.length;
  }
}

export function formatAggregateValue(operation: AggregateOperation, value: number): string {
  if (operation === "count" || operation === "distinct") {
    return value.toLocaleString();
  }
  if (operation === "avg") {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}
