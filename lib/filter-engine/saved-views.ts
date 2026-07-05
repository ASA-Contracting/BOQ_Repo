import type { ColumnLayoutApi } from "@/components/filter-engine/use-column-layout";
import type { FilterEngineState } from "@/components/filter-engine/use-filter-engine";
import type { GridGroupingState } from "@/components/filter-engine/use-grid-grouping";
import type { FilterableColumn } from "@/components/filter-engine/filterable-data-grid";

import {
  createFilterGroupId,
  createFilterRowId,
} from "./policy";
import {
  normalizeSavedFilterDefinition,
  restoreSavedFilterGroups,
  serializeSavedFilterDefinition,
} from "./saved-filters";
import type {
  FilterGroupState,
  FilterRowState,
  SavedColumnFilterState,
  SavedFilterDefinition,
  SavedViewGroupingState,
  SavedViewLayoutState,
  SortState,
} from "./types";

function normalizeLayoutState(
  layout: SavedViewLayoutState | null | undefined,
): SavedViewLayoutState | undefined {
  if (!layout) return undefined;

  const hiddenColumnIds = (layout.hiddenColumnIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean);
  const columnOrder = (layout.columnOrder ?? []).map((id) => id.trim()).filter(Boolean);
  const pinById = Object.fromEntries(
    Object.entries(layout.pinById ?? {}).filter(([id, pin]) => !!id.trim() && !!pin),
  ) as Record<string, "left" | "right">;
  const alignById = Object.fromEntries(
    Object.entries(layout.alignById ?? {}).filter(([id, align]) => !!id.trim() && !!align),
  ) as Record<string, "left" | "center" | "right">;
  const widthById = Object.fromEntries(
    Object.entries(layout.widthById ?? {}).filter(([id, width]) => !!id.trim() && !!width.trim()),
  );

  if (
    !hiddenColumnIds.length &&
    !columnOrder.length &&
    !Object.keys(pinById).length &&
    !Object.keys(alignById).length &&
    !Object.keys(widthById).length
  ) {
    return undefined;
  }

  return {
    ...(hiddenColumnIds.length ? { hiddenColumnIds } : {}),
    ...(columnOrder.length ? { columnOrder } : {}),
    ...(Object.keys(pinById).length ? { pinById } : {}),
    ...(Object.keys(alignById).length ? { alignById } : {}),
    ...(Object.keys(widthById).length ? { widthById } : {}),
  };
}

function normalizeGroupingState(
  grouping: SavedViewGroupingState | null | undefined,
): SavedViewGroupingState | undefined {
  if (!grouping) return undefined;

  const selections = (grouping.selections ?? [])
    .map((row) => ({
      field: row.field.trim(),
      direction: row.direction === "desc" ? "desc" as const : "asc" as const,
    }))
    .filter((row) => row.field);

  const expandedGroupKeys = (grouping.expandedGroupKeys ?? [])
    .map((key) => key.trim())
    .filter(Boolean);
  const columnAggregates = Object.fromEntries(
    Object.entries(grouping.columnAggregates ?? {}).filter(([id]) => !!id.trim()),
  );

  if (
    !selections.length &&
    !expandedGroupKeys.length &&
    !Object.values(columnAggregates).some(Boolean)
  ) {
    return undefined;
  }

  return {
    ...(selections.length ? { selections } : {}),
    ...(expandedGroupKeys.length ? { expandedGroupKeys } : {}),
    ...(Object.values(columnAggregates).some(Boolean) ? { columnAggregates } : {}),
  };
}

function normalizeColumnFilters(
  columnFilters: SavedColumnFilterState[] | null | undefined,
): SavedColumnFilterState[] | undefined {
  const normalized = (columnFilters ?? [])
    .map((filter) => ({
      field: filter.field.trim(),
      operator: filter.operator,
      value: filter.value,
    }))
    .filter((filter) => !!filter.field && filter.operator !== "globalSearch");

  return normalized.length ? normalized : undefined;
}

function normalizeSorts(sorts: SortState[] | null | undefined): SortState[] | undefined {
  const normalized = (sorts ?? [])
    .map((sort) => ({
      field: sort.field.trim(),
      direction: sort.direction === "desc" ? "desc" as const : "asc" as const,
    }))
    .filter((sort) => !!sort.field);

  return normalized.length ? normalized : undefined;
}

export function hasSavedViewContent(
  definition: SavedFilterDefinition | null | undefined,
): boolean {
  return normalizeSavedViewDefinition(definition) != null;
}

export function normalizeSavedViewDefinition(
  definition: SavedFilterDefinition | null | undefined,
): SavedFilterDefinition | null {
  const filterPart = normalizeSavedFilterDefinition(definition);
  const sorts = normalizeSorts(definition?.sorts);
  const columnFilters = normalizeColumnFilters(definition?.columnFilters);
  const grouping = normalizeGroupingState(definition?.grouping);
  const layout = normalizeLayoutState(definition?.layout);

  if (!filterPart && !sorts && !columnFilters && !grouping && !layout) {
    return null;
  }

  return {
    groups: filterPart?.groups ?? [],
    ...(filterPart?.globalSearch ? { globalSearch: filterPart.globalSearch } : {}),
    ...(sorts ? { sorts } : {}),
    ...(columnFilters ? { columnFilters } : {}),
    ...(grouping ? { grouping } : {}),
    ...(layout ? { layout } : {}),
  };
}

export function captureGridViewState<T>(
  engine: FilterEngineState<T>,
  layout: ColumnLayoutApi<T>,
  grouping: GridGroupingState<T>,
): SavedFilterDefinition | null {
  const filterPart = serializeSavedFilterDefinition(engine.filterGroups, engine.globalSearch);
  const hiddenColumnIds = [...layout.hiddenIds];
  const layoutState: SavedViewLayoutState = {
    ...(hiddenColumnIds.length ? { hiddenColumnIds } : {}),
    ...(layout.order.length ? { columnOrder: layout.order } : {}),
    ...(Object.keys(layout.pinById).length
      ? {
          pinById: Object.fromEntries(
            Object.entries(layout.pinById).filter((entry): entry is [string, "left" | "right"] => !!entry[1]),
          ),
        }
      : {}),
    ...(Object.keys(layout.alignById).length ? { alignById: layout.alignById } : {}),
    ...(Object.keys(layout.widthById).length ? { widthById: layout.widthById } : {}),
  };

  const groupingState: SavedViewGroupingState = {
    selections: grouping.selections.map((selection) => ({
      field: selection.field,
      direction: selection.order,
    })),
    expandedGroupKeys: [...grouping.expandedGroups],
    columnAggregates: grouping.columnAggregates,
  };

  const columnFilters: SavedColumnFilterState[] = engine.columnFilters
    .filter((filter) => filter.operator !== "globalSearch")
    .map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    }));

  return normalizeSavedViewDefinition({
    groups: filterPart?.groups ?? [],
    ...(filterPart?.globalSearch ? { globalSearch: filterPart.globalSearch } : {}),
    ...(engine.sorts.length ? { sorts: engine.sorts } : {}),
    ...(columnFilters.length ? { columnFilters } : {}),
    grouping: groupingState,
    layout: layoutState,
  });
}

function createEmptyRow(): FilterRowState {
  return {
    id: createFilterRowId(),
    field: "",
    operator: "contains",
    value: "",
    joinWithPrev: "and",
  };
}

function createEmptyGroup(rows: FilterRowState[]): FilterGroupState {
  return {
    id: createFilterGroupId(),
    joinWithPrev: "and",
    rows,
  };
}

export function applyGridViewState<T>(
  definition: SavedFilterDefinition | null | undefined,
  engine: FilterEngineState<T>,
  layout: ColumnLayoutApi<T>,
  grouping: GridGroupingState<T>,
  columns: FilterableColumn<T>[],
): void {
  const normalized = normalizeSavedViewDefinition(definition);
  if (!normalized) return;

  const groups = restoreSavedFilterGroups(normalized, createEmptyRow, createEmptyGroup);
  engine.setFilterGroups(groups);
  engine.setGlobalSearch(normalized.globalSearch ?? "");
  engine.setColumnFiltersFromSaved(
    (normalized.columnFilters ?? []).map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    })),
  );
  engine.setSortsFromSaved(normalized.sorts ?? []);
  engine.setAppliedFromSaved(groups.length > 0 || !!(normalized.globalSearch ?? "").trim());

  layout.applyLayoutState(normalized.layout, columns);
  grouping.applyGroupingState(normalized.grouping);
}
