"use client";

import * as React from "react";

import type {
  FilterColumnDef,
  FilterGroupState,
  FilterRowState,
  FilterState,
  SortState,
} from "@/lib/filter-engine";
import {
  applyFilters,
  applySorts,
  buildGlobalSearchFilters,
  createFilterGroupId,
  createFilterRowId,
  removeColumnFilterState,
  upsertColumnFilterState,
} from "@/lib/filter-engine";
import { restoreSavedFilterGroups, serializeSavedFilterDefinition } from "@/lib/filter-engine/saved-filters";

export type UseFilterEngineOptions<T> = {
  data: T[];
  columns: FilterColumnDef<T>[];
  initialGlobalSearch?: string;
};

function createEmptyRow(): FilterRowState {
  return {
    id: createFilterRowId(),
    field: "",
    operator: "contains",
    value: "",
    joinWithPrev: "and",
  };
}

function createEmptyGroup(rows: FilterRowState[] = [createEmptyRow()]): FilterGroupState {
  return {
    id: createFilterGroupId(),
    joinWithPrev: "and",
    rows,
  };
}

function groupsToFilterStates(groups: FilterGroupState[]): FilterState[] {
  const filters: FilterState[] = [];

  for (const group of groups) {
    for (const row of group.rows) {
      if (!row.field.trim()) {
        continue;
      }
      filters.push({
        field: row.field,
        operator: row.operator,
        value: row.value,
        joinWithPrev: row.joinWithPrev,
      });
    }
  }

  return filters;
}

export function useFilterEngine<T>({ data, columns, initialGlobalSearch = "" }: UseFilterEngineOptions<T>) {
  const [globalSearch, setGlobalSearch] = React.useState(initialGlobalSearch);
  const [filterGroups, setFilterGroups] = React.useState<FilterGroupState[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<FilterState[]>([]);
  const [sorts, setSorts] = React.useState<SortState[]>([]);
  const [applied, setApplied] = React.useState(false);

  const toolbarFilters = React.useMemo(
    () => (applied ? groupsToFilterStates(filterGroups) : []),
    [applied, filterGroups],
  );
  const globalSearchFilters = React.useMemo(
    () => buildGlobalSearchFilters(globalSearch, columns),
    [globalSearch, columns],
  );

  const activeFilters = React.useMemo(
    () => [...columnFilters, ...toolbarFilters, ...globalSearchFilters],
    [columnFilters, toolbarFilters, globalSearchFilters],
  );

  const filteredData = React.useMemo(
    () => applyFilters(data, activeFilters, columns),
    [activeFilters, columns, data],
  );

  const displayData = React.useMemo(
    () => applySorts(filteredData, sorts, columns),
    [filteredData, sorts, columns],
  );

  const hasActiveFilters =
    globalSearch.trim().length > 0 ||
    columnFilters.some((filter) => filter.operator !== "globalSearch") ||
    (applied && toolbarFilters.length > 0);

  const setColumnFilter = React.useCallback((field: string, operator: FilterState["operator"], value: FilterState["value"]) => {
    setColumnFilters((current) => upsertColumnFilterState(current, { field, operator, value }));
  }, []);

  const clearColumnFilter = React.useCallback((field: string) => {
    setColumnFilters((current) => removeColumnFilterState(current, field));
  }, []);

  const setSort = React.useCallback((field: string, direction: SortState["direction"] | null) => {
    if (!direction) {
      setSorts([]);
      return;
    }
    setSorts([{ field, direction }]);
  }, []);

  const toggleSort = React.useCallback((field: string) => {
    setSorts((current) => {
      const existing = current.find((sort) => sort.field === field);
      if (!existing) {
        return [{ field, direction: "asc" }];
      }
      if (existing.direction === "asc") {
        return [{ field, direction: "desc" }];
      }
      return [];
    });
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setGlobalSearch("");
    setColumnFilters([]);
    setFilterGroups([]);
    setApplied(false);
  }, []);

  const applyToolbarFilters = React.useCallback(() => {
    setApplied(true);
  }, []);

  const addToolbarFilter = React.useCallback(() => {
    setFilterGroups((current) => {
      const nextGroup = createEmptyGroup();
      if (current.length > 0) {
        nextGroup.joinWithPrev = current[1]?.joinWithPrev === "or" ? "or" : "and";
      }
      return [...current, nextGroup];
    });
  }, []);

  const addNestedFilter = React.useCallback((groupId: string) => {
    setFilterGroups((current) => {
      const groupIndex = current.findIndex((group) => group.id === groupId);
      const nextRow = createEmptyRow();

      if (groupIndex < 0) {
        return [...current, createEmptyGroup([nextRow])];
      }

      const targetGroup = current[groupIndex];
      if (targetGroup.rows.length > 1) {
        nextRow.joinWithPrev = targetGroup.rows[1]?.joinWithPrev === "or" ? "or" : "and";
      }

      return current.map((group, index) =>
        index === groupIndex ? { ...group, rows: [...group.rows, nextRow] } : group,
      );
    });
  }, []);

  const removeToolbarFilter = React.useCallback((filterId: string) => {
    setFilterGroups((current) => {
      const next = current
        .map((group) => ({
          ...group,
          rows: group.rows.filter((row) => row.id !== filterId),
        }))
        .filter((group) => group.rows.length > 0);
      if (next.length === 0) {
        setApplied(false);
      }
      return next;
    });
  }, []);

  const clearFilterGroup = React.useCallback((groupId: string) => {
    setFilterGroups((current) => {
      const next = current.filter((group) => group.id !== groupId);
      if (next.length === 0) {
        setApplied(false);
      }
      return next;
    });
  }, []);

  const updateToolbarFilter = React.useCallback((filterId: string, patch: Partial<FilterRowState>) => {
    setFilterGroups((current) =>
      current.map((group) => ({
        ...group,
        rows: group.rows.map((row) => (row.id === filterId ? { ...row, ...patch } : row)),
      })),
    );
  }, []);

  const loadSavedDefinition = React.useCallback(
    (definition: Parameters<typeof restoreSavedFilterGroups>[0]) => {
      const groups = restoreSavedFilterGroups(definition, createEmptyRow, createEmptyGroup);
      setFilterGroups(groups);
      setGlobalSearch(definition?.globalSearch ?? "");
      setColumnFilters([]);
      setApplied(true);
    },
    [],
  );

  const getCurrentDefinition = React.useCallback(
    () => serializeSavedFilterDefinition(filterGroups, globalSearch),
    [filterGroups, globalSearch],
  );

  const openFilterForColumn = React.useCallback((field: string) => {
    const normalizedField = field.trim();
    if (!normalizedField) return;

    setFilterGroups((current) => {
      for (const group of current) {
        for (const row of group.rows) {
          if (row.field.trim() === normalizedField) {
            return current;
          }
        }
      }

      const nextRow = createEmptyRow();
      nextRow.field = normalizedField;
      return [...current, createEmptyGroup([nextRow])];
    });
    setApplied(true);
  }, []);

  return {
    globalSearch,
    setGlobalSearch,
    filterGroups,
    setFilterGroups,
    columnFilters,
    sorts,
    displayData,
    hasActiveFilters,
    applied,
    setColumnFilter,
    clearColumnFilter,
    toggleSort,
    setSort,
    clearAllFilters,
    applyToolbarFilters,
    addToolbarFilter,
    addNestedFilter,
    removeToolbarFilter,
    clearFilterGroup,
    updateToolbarFilter,
    loadSavedDefinition,
    getCurrentDefinition,
    openFilterForColumn,
    activeFilterFields: new Set(
      columnFilters.filter((filter) => filter.operator !== "globalSearch").map((filter) => filter.field),
    ),
  };
}

export type FilterEngineState<T> = ReturnType<typeof useFilterEngine<T>>;
