import type { FilterColumnDef, SortDirection } from "./types";

export type GroupSelection = {
  field: string;
  order: SortDirection;
};

export type GroupBlock<T> = {
  key: string;
  label: string;
  rows: T[];
};

export function getGroupValue<T>(row: T, column: FilterColumnDef<T>): string {
  const raw = column.getValue ? column.getValue(row) : (row as Record<string, unknown>)[column.field];
  const text = raw === null || raw === undefined ? "" : String(raw).trim();
  return text || "(Empty)";
}

export function buildGroupBlocks<T>(
  rows: T[],
  column: FilterColumnDef<T>,
  order: SortDirection,
): GroupBlock<T>[] {
  const map = new Map<string, T[]>();

  for (const row of rows) {
    const key = getGroupValue(row, column);
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }

  const blocks = Array.from(map.entries()).map(([key, groupRows]) => ({
    key,
    label: key,
    rows: groupRows,
  }));

  blocks.sort((left, right) => {
    const cmp = left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" });
    return order === "desc" ? -cmp : cmp;
  });

  return blocks;
}

export function groupableColumns<T>(columns: FilterColumnDef<T>[]): FilterColumnDef<T>[] {
  return columns.filter((column) => column.groupable !== false && column.field !== "id");
}
