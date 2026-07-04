"use client";

import * as React from "react";

import type { FilterColumnDef, SortDirection } from "@/lib/filter-engine";
import {
  type AggregateOperation,
  calculateAggregate,
  formatAggregateValue,
} from "@/lib/filter-engine/aggregates";
import { buildGroupBlocks, groupableColumns, type GroupSelection } from "@/lib/filter-engine/grouping";

export type ColumnAggregateState = Record<string, AggregateOperation | null>;

type GridGroupingOptions = {
  initialGroupField?: string;
};

export function useGridGrouping<T>(
  columns: FilterColumnDef<T>[],
  options: GridGroupingOptions = {},
) {
  const groupOptions = React.useMemo(() => groupableColumns(columns), [columns]);
  const initialField = options.initialGroupField?.trim() ?? "";

  const [selections, setSelections] = React.useState<GroupSelection[]>(() => [
    { field: initialField, order: "asc" },
  ]);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(() => new Set());
  const [columnAggregates, setColumnAggregates] = React.useState<ColumnAggregateState>({});

  const primaryGroup = selections.find((selection) => selection.field.trim()) ?? null;

  const primaryColumn = primaryGroup
    ? columns.find((column) => column.field === primaryGroup.field) ?? null
    : null;

  const groupLabel = primaryColumn?.label ?? "None";
  const isGrouped = !!primaryGroup && !!primaryColumn;

  const setPrimaryGroup = React.useCallback(
    (field: string | null, order: SortDirection = "asc") => {
      if (!field) {
        setSelections([{ field: "", order: "asc" }]);
        setExpandedGroups(new Set());
        return;
      }
      setSelections([{ field, order }]);
      setExpandedGroups(new Set());
    },
    [],
  );

  const updatePrimaryOrder = React.useCallback((order: SortDirection) => {
    setSelections((current) => {
      const primary = current[0] ?? { field: "", order: "asc" };
      return [{ ...primary, order }];
    });
  }, []);

  const addGroupLevel = React.useCallback(() => {
    setSelections((current) => {
      const used = new Set(current.map((row) => row.field).filter(Boolean));
      const nextField =
        groupOptions.find((column) => !used.has(column.field))?.field ?? "";
      if (!nextField) return current;
      return [...current, { field: nextField, order: "asc" }];
    });
  }, [groupOptions]);

  const removeGroupLevel = React.useCallback((index: number) => {
    setSelections((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [{ field: "", order: "asc" }];
    });
    setExpandedGroups(new Set());
  }, []);

  const updateGroupField = React.useCallback((index: number, field: string) => {
    setSelections((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, field } : row)),
    );
    setExpandedGroups(new Set());
  }, []);

  const updateGroupOrder = React.useCallback((index: number, order: SortDirection) => {
    setSelections((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, order } : row)),
    );
  }, []);

  const clearGrouping = React.useCallback(() => {
    setSelections([{ field: "", order: "asc" }]);
    setExpandedGroups(new Set());
  }, []);

  const expandAllGroups = React.useCallback((keys: string[]) => {
    setExpandedGroups(new Set(keys));
  }, []);

  const collapseAllGroups = React.useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  const toggleGroupExpanded = React.useCallback((key: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const setColumnAggregate = React.useCallback((columnId: string, operation: AggregateOperation | null) => {
    setColumnAggregates((current) => ({ ...current, [columnId]: operation }));
  }, []);

  const hasActiveAggregates = React.useMemo(
    () => Object.values(columnAggregates).some(Boolean),
    [columnAggregates],
  );

  const getAggregateDisplay = React.useCallback(
    (column: FilterColumnDef<T>, rows: T[]) => {
      const operation = columnAggregates[column.id];
      if (!operation) return null;
      const value = calculateAggregate(rows, column, operation);
      return formatAggregateValue(operation, value);
    },
    [columnAggregates],
  );

  const buildBlocks = React.useCallback(
    (rows: T[]) => {
      if (!isGrouped || !primaryColumn || !primaryGroup) return [];
      return buildGroupBlocks(rows, primaryColumn, primaryGroup.order);
    },
    [isGrouped, primaryColumn, primaryGroup],
  );

  return {
    groupOptions,
    selections,
    primaryGroup,
    primaryColumn,
    groupLabel,
    isGrouped,
    expandedGroups,
    columnAggregates,
    hasActiveAggregates,
    setPrimaryGroup,
    updatePrimaryOrder,
    addGroupLevel,
    removeGroupLevel,
    updateGroupField,
    updateGroupOrder,
    clearGrouping,
    expandAllGroups,
    collapseAllGroups,
    toggleGroupExpanded,
    setColumnAggregate,
    getAggregateDisplay,
    buildBlocks,
  };
}

export type GridGroupingState<T> = ReturnType<typeof useGridGrouping<T>>;
