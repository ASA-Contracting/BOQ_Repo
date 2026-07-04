import type {
  FilterGroupState,
  FilterJoin,
  FilterOperator,
  FilterRowState,
  SavedFilterDefinition,
  SavedFilterGroupState,
  SavedFilterRowState,
} from "./types";
import { isFilterComplete } from "./operators";
import { operatorNeedsNoValue } from "./policy";

const normalizeJoin = (value?: FilterJoin | string | null, isFirst = false): FilterJoin => {
  if (isFirst) {
    return "and";
  }
  return value === "or" ? "or" : "and";
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : String(value ?? "").trim();

const normalizeOperator = (value: unknown): FilterOperator =>
  (normalizeText(value) || "contains") as FilterOperator;

function normalizeDefinitionGroups(
  groups: SavedFilterGroupState[] | null | undefined,
): SavedFilterGroupState[] {
  const normalizedGroups: SavedFilterGroupState[] = [];

  for (const rawGroup of groups ?? []) {
    const normalizedRows: SavedFilterRowState[] = [];

    for (const rawRow of rawGroup?.rows ?? []) {
      const field = normalizeText(rawRow?.field);
      const operator = normalizeOperator(rawRow?.operator);
      if (!field || !operator) {
        continue;
      }

      normalizedRows.push({
        field,
        operator,
        value: normalizeText(rawRow?.value),
        joinWithPrev: normalizeJoin(rawRow?.joinWithPrev),
      });
    }

    if (!normalizedRows.length) {
      continue;
    }

    normalizedGroups.push({
      joinWithPrev: normalizeJoin(rawGroup?.joinWithPrev),
      rows: normalizedRows.map((row, index) => ({
        ...row,
        joinWithPrev: normalizeJoin(index === 0 ? "and" : row.joinWithPrev, index === 0),
      })),
    });
  }

  return normalizedGroups.map((group, index) => ({
    ...group,
    joinWithPrev: normalizeJoin(index === 0 ? "and" : group.joinWithPrev, index === 0),
  }));
}

export function normalizeSavedFilterDefinition(
  definition: SavedFilterDefinition | null | undefined,
): SavedFilterDefinition | null {
  const groups = normalizeDefinitionGroups(definition?.groups);
  const globalSearch = normalizeText(definition?.globalSearch);
  if (!groups.length && !globalSearch) {
    return null;
  }
  return {
    groups,
    ...(globalSearch ? { globalSearch } : {}),
  };
}

export function serializeSavedFilterDefinition(
  groups: FilterGroupState[],
  globalSearch = "",
): SavedFilterDefinition | null {
  const serializedGroups: SavedFilterGroupState[] = [];

  groups.forEach((group, groupIndex) => {
    const rows = (group?.rows ?? [])
      .filter((filter) => isFilterComplete(filter.field, filter.operator, filter.value))
      .map((filter, rowIndex) => ({
        field: normalizeText(filter.field),
        operator: normalizeOperator(filter.operator),
        value: operatorNeedsNoValue(filter.operator) ? "" : normalizeText(filter.value),
        joinWithPrev: normalizeJoin(rowIndex === 0 ? "and" : filter.joinWithPrev, rowIndex === 0),
      }))
      .filter((row) => !!row.field);

    if (!rows.length) {
      return;
    }

    serializedGroups.push({
      joinWithPrev: normalizeJoin(groupIndex === 0 ? "and" : group?.joinWithPrev, groupIndex === 0),
      rows,
    });
  });

  const normalized = normalizeSavedFilterDefinition({
    groups: serializedGroups,
    globalSearch: normalizeText(globalSearch) || undefined,
  });
  return normalized;
}

export function restoreSavedFilterGroups(
  definition: SavedFilterDefinition | null | undefined,
  createRow: () => FilterRowState,
  createGroup: (rows: FilterRowState[]) => FilterGroupState,
): FilterGroupState[] {
  const normalized = normalizeSavedFilterDefinition(definition);
  if (!normalized) {
    return [];
  }

  return normalized.groups.map((groupState, groupIndex) => {
    const rows = groupState.rows.map((rowState, rowIndex) => {
      const row = createRow();
      row.field = rowState.field;
      row.operator = normalizeOperator(rowState.operator);
      row.value = rowState.value;
      row.joinWithPrev = normalizeJoin(rowIndex === 0 ? "and" : rowState.joinWithPrev, rowIndex === 0);
      return row;
    });

    const group = createGroup(rows);
    group.joinWithPrev = normalizeJoin(groupIndex === 0 ? "and" : groupState.joinWithPrev, groupIndex === 0);
    group.rows = rows;
    return group;
  });
}

export function buildSavedFilterComparableKey(
  definition: SavedFilterDefinition | null | undefined,
): string {
  const normalized = normalizeSavedFilterDefinition(definition);
  return normalized ? JSON.stringify(normalized) : "";
}
