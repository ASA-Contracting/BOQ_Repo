import { naturalSort } from "react-pivottable/Utilities";

import type { PivotRecord, PivotValueFilter } from "@/lib/analytics/pivot-engine/types";

export type FieldValueOption = {
  value: string;
  count: number;
  excluded: boolean;
};

export function getFieldValueOptions(
  data: PivotRecord[],
  field: string,
  valueFilter: PivotValueFilter,
): FieldValueOption[] {
  const counts = new Map<string, number>();

  for (const row of data) {
    const value = String(row[field] ?? "");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const excluded = valueFilter[field] ?? {};

  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
      excluded: Boolean(excluded[value]),
    }))
    .sort((a, b) => naturalSort(a.value, b.value));
}

/** Included-only filter: selected values stay visible; unselected are excluded. */
export function buildValueFilterFromSelection(
  field: string,
  allValues: string[],
  selected: Set<string>,
): PivotValueFilter {
  if (selected.size === 0 || selected.size === allValues.length) {
    return {};
  }

  const excluded: Record<string, boolean> = {};
  for (const value of allValues) {
    if (!selected.has(value)) {
      excluded[value] = true;
    }
  }

  return { [field]: excluded };
}

export function filterRecordsBySearch(data: PivotRecord[], query: string): PivotRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return data;

  return data.filter((row) =>
    Object.values(row).some((value) => String(value).toLowerCase().includes(normalized)),
  );
}
