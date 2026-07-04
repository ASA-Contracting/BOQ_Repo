"use client";

import * as React from "react";

import type { FilterableColumn } from "@/components/filter-engine/filterable-data-grid";

export type ColumnPin = "left" | "right" | null;
export type ColumnAlign = "left" | "center" | "right";

export type ColumnLayoutState = {
  hiddenIds: Set<string>;
  pinById: Record<string, ColumnPin>;
  alignById: Record<string, ColumnAlign>;
  widthById: Record<string, string>;
  order: string[];
};

function buildDefaultOrder<T>(columns: FilterableColumn<T>[]): string[] {
  return columns.map((column) => column.id);
}

type ColumnLayoutOptions = {
  initialHiddenColumnIds?: string[];
  initialWidthById?: Record<string, string>;
  initialPinById?: Record<string, ColumnPin>;
};

function buildInitialHiddenIds<T>(
  columns: FilterableColumn<T>[],
  options: ColumnLayoutOptions = {},
): Set<string> {
  const hidden = new Set(columns.filter((column) => column.filterOnly).map((column) => column.id));
  for (const id of options.initialHiddenColumnIds ?? []) {
    hidden.add(id);
  }
  return hidden;
}

export function useColumnLayout<T>(
  columns: FilterableColumn<T>[],
  options: ColumnLayoutOptions = {},
) {
  const defaultOrderRef = React.useRef(buildDefaultOrder(columns));
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(() =>
    buildInitialHiddenIds(columns, options),
  );
  const [pinById, setPinById] = React.useState<Record<string, ColumnPin>>(
    () => ({ ...(options.initialPinById ?? {}) }),
  );
  const [alignById, setAlignById] = React.useState<Record<string, ColumnAlign>>({});
  const [widthById, setWidthById] = React.useState<Record<string, string>>(
    () => ({ ...(options.initialWidthById ?? {}) }),
  );
  const [order, setOrder] = React.useState<string[]>(() => buildDefaultOrder(columns));

  React.useEffect(() => {
    const nextIds = new Set(columns.map((column) => column.id));
    setOrder((current) => {
      const kept = current.filter((id) => nextIds.has(id));
      const missing = columns.map((column) => column.id).filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
    setHiddenIds((current) => new Set([...current].filter((id) => nextIds.has(id))));
  }, [columns]);

  const columnById = React.useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );

  const orderedColumns = React.useMemo(
    () =>
      order
        .map((id) => columnById.get(id))
        .filter((column): column is FilterableColumn<T> => !!column),
    [columnById, order],
  );

  const visibleColumns = React.useMemo(
    () => orderedColumns.filter((column) => !hiddenIds.has(column.id)),
    [hiddenIds, orderedColumns],
  );

  const canToggleColumn = React.useCallback(
    (columnId: string) => {
      if (pinById[columnId]) return false;
      if (!hiddenIds.has(columnId) && visibleColumns.length <= 1) return false;
      return true;
    },
    [hiddenIds, pinById, visibleColumns.length],
  );

  const toggleColumnVisibility = React.useCallback(
    (columnId: string) => {
      if (!canToggleColumn(columnId) && !hiddenIds.has(columnId)) return;
      setHiddenIds((current) => {
        const next = new Set(current);
        if (next.has(columnId)) next.delete(columnId);
        else next.add(columnId);
        return next;
      });
    },
    [canToggleColumn, hiddenIds],
  );

  const showAllColumns = React.useCallback(() => {
    setHiddenIds(new Set());
  }, []);

  const hideAllColumns = React.useCallback(() => {
    const firstToggleable = orderedColumns.find((column) => canToggleColumn(column.id));
    const keep = firstToggleable?.id ?? orderedColumns[0]?.id;
    if (!keep) return;
    setHiddenIds(new Set(orderedColumns.map((column) => column.id).filter((id) => id !== keep)));
  }, [canToggleColumn, orderedColumns]);

  const showOnlyColumn = React.useCallback(
    (columnId: string) => {
      setHiddenIds(new Set(orderedColumns.map((column) => column.id).filter((id) => id !== columnId)));
    },
    [orderedColumns],
  );

  const hideColumn = React.useCallback(
    (columnId: string) => {
      toggleColumnVisibility(columnId);
    },
    [toggleColumnVisibility],
  );

  const resetColumns = React.useCallback(() => {
    setHiddenIds(new Set());
    setPinById({});
    setAlignById({});
    setWidthById({});
    setOrder([...defaultOrderRef.current]);
  }, []);

  const setColumnPin = React.useCallback((columnId: string, pin: ColumnPin) => {
    setPinById((current) => {
      const next = { ...current };
      if (!pin) delete next[columnId];
      else next[columnId] = pin;
      return next;
    });
  }, []);

  const setColumnAlign = React.useCallback((columnId: string, align: ColumnAlign) => {
    setAlignById((current) => ({ ...current, [columnId]: align }));
  }, []);

  const setColumnWidth = React.useCallback((columnId: string, width: string) => {
    setWidthById((current) => ({ ...current, [columnId]: width }));
  }, []);

  const moveColumn = React.useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setOrder((current) => {
      const activeIndex = current.indexOf(activeId);
      const overIndex = current.indexOf(overId);
      if (activeIndex === -1 || overIndex === -1) return current;
      const next = [...current];
      next.splice(activeIndex, 1);
      next.splice(overIndex, 0, activeId);
      return next;
    });
  }, []);

  return {
    visibleColumns,
    orderedColumns,
    hiddenIds,
    order,
    pinById,
    alignById,
    widthById,
    canToggleColumn,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
    showOnlyColumn,
    hideColumn,
    resetColumns,
    setColumnPin,
    setColumnAlign,
    setColumnWidth,
    moveColumn,
  };
}

export type ColumnLayoutApi<T> = ReturnType<typeof useColumnLayout<T>>;
