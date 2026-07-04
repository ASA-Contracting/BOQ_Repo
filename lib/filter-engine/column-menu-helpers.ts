import type { FilterColumnDef } from "./types";
import { getDistinctValues } from "./policy";

export type ColumnStatsSummary = {
  nonEmpty: number;
  empty: number;
  unique: number;
  min: number | null;
  max: number | null;
  avg: number | null;
};

function getCellText<T>(row: T, column: FilterColumnDef<T>): string {
  const raw = column.getValue ? column.getValue(row) : (row as Record<string, unknown>)[column.field];
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getColumnStatsSummary<T>(
  data: T[],
  column: FilterColumnDef<T>,
): ColumnStatsSummary {
  let nonEmpty = 0;
  let empty = 0;
  const unique = new Set<string>();
  const numerics: number[] = [];

  for (const row of data) {
    const text = getCellText(row, column);
    if (!text) {
      empty += 1;
      continue;
    }
    nonEmpty += 1;
    unique.add(text.toLowerCase());
    const numeric = parseNumeric(column.getValue ? column.getValue(row) : (row as Record<string, unknown>)[column.field]);
    if (numeric !== null) numerics.push(numeric);
  }

  const min = numerics.length ? Math.min(...numerics) : null;
  const max = numerics.length ? Math.max(...numerics) : null;
  const avg =
    numerics.length > 0
      ? numerics.reduce((sum, value) => sum + value, 0) / numerics.length
      : null;

  return { nonEmpty, empty, unique: unique.size, min, max, avg };
}

export function formatStatValue(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function isNumericColumn<T>(column: FilterColumnDef<T>): boolean {
  return column.filterType === "number";
}

export function getTopBottomFilterValues<T>(
  data: T[],
  column: FilterColumnDef<T>,
  direction: "top" | "bottom",
  limit = 10,
): string[] {
  const numericMap = new Map<number, Set<string>>();

  for (const row of data) {
    const raw = column.getValue ? column.getValue(row) : (row as Record<string, unknown>)[column.field];
    const numeric = parseNumeric(raw);
    if (numeric === null) continue;
    const key = String(raw ?? "").trim();
    if (!numericMap.has(numeric)) numericMap.set(numeric, new Set());
    if (key) numericMap.get(numeric)!.add(key);
  }

  const sorted = Array.from(numericMap.keys()).sort((a, b) =>
    direction === "top" ? b - a : a - b,
  );

  const selected = new Set<string>();
  for (const numeric of sorted.slice(0, limit)) {
    for (const value of numericMap.get(numeric) ?? []) selected.add(value);
  }
  return Array.from(selected);
}

export function getColumnCopyValues<T>(data: T[], column: FilterColumnDef<T>): string[] {
  return data.map((row) => getCellText(row, column)).filter((value) => value.length > 0);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard unavailable");
}

export function estimateColumnWidth<T>(data: T[], column: FilterColumnDef<T>, label: string): string {
  let maxLen = label.length;
  for (const row of data.slice(0, 200)) {
    maxLen = Math.max(maxLen, getCellText(row, column).length);
  }
  const px = Math.min(Math.max(maxLen * 8 + 32, 80), 420);
  return `${px}px`;
}

export function getDistinctValuesForColumn<T>(data: T[], column: FilterColumnDef<T>): string[] {
  return getDistinctValues(data, column.field, column);
}
