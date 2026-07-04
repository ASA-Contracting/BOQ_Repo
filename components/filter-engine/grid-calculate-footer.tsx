"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import type { DataTableColumn } from "@/components/ui/data-table";
import {
  AGGREGATE_LABELS,
  type AggregateOperation,
  operationsForColumn,
} from "@/lib/filter-engine/aggregates";
import type { FilterColumnDef } from "@/lib/filter-engine";

import "@/styles/abrd-grid-calculate-footer.css";

type GridCalculateFooterProps<T> = {
  columns: DataTableColumn<T>[];
  sourceColumns: FilterColumnDef<T>[];
  columnAggregates: Record<string, AggregateOperation | null>;
  getAggregateDisplay: (column: FilterColumnDef<T>, rows: T[]) => string | null;
  rows: T[];
  onSetAggregate: (columnId: string, operation: AggregateOperation | null) => void;
  hasSelectionColumn?: boolean;
};

export function GridCalculateFooter<T>({
  columns,
  sourceColumns,
  columnAggregates,
  getAggregateDisplay,
  rows,
  onSetAggregate,
  hasSelectionColumn = false,
}: GridCalculateFooterProps<T>) {
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(null);
  const [pendingOperation, setPendingOperation] = React.useState<AggregateOperation | "">("");
  const [menuPosition, setMenuPosition] = React.useState({ left: 12, top: 12 });
  const panelRef = React.useRef<HTMLDivElement>(null);

  const sourceById = React.useMemo(() => {
    const map = new Map<string, FilterColumnDef<T>>();
    for (const column of sourceColumns) map.set(column.id, column);
    return map;
  }, [sourceColumns]);

  const activeSourceColumn = activeColumnId ? sourceById.get(activeColumnId) ?? null : null;

  React.useEffect(() => {
    if (!activeColumnId) return;
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as Element).closest?.(".grid-calculate-footer__trigger")) return;
      setActiveColumnId(null);
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [activeColumnId]);

  const openColumnMenu = (
    columnId: string,
    anchor: HTMLElement,
    currentOperation: AggregateOperation | null,
  ) => {
    const rect = anchor.getBoundingClientRect();
    const panelWidth = 260;
    const panelHeight = 188;
    const margin = 12;
    const gap = 8;
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - panelWidth - margin);
    const spaceAbove = rect.top - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const preferAbove = spaceAbove >= panelHeight || spaceAbove >= spaceBelow;
    const top = preferAbove
      ? Math.max(margin, rect.top - panelHeight - gap)
      : Math.min(window.innerHeight - panelHeight - margin, rect.bottom + gap);

    setMenuPosition({ left, top });
    setPendingOperation(currentOperation ?? "");
    setActiveColumnId((current) => (current === columnId ? null : columnId));
  };

  const applyOperation = () => {
    if (!activeColumnId) return;
    onSetAggregate(activeColumnId, pendingOperation || null);
    setActiveColumnId(null);
  };

  return (
    <>
      <tr className="grid-calculate-footer__row">
        {hasSelectionColumn ? (
          <td className="grid-calculate-footer__cell grid-calculate-footer__cell--scope selection-cell" />
        ) : null}
        {columns.map((column, index) => {
          const sourceColumn = sourceById.get(column.id);
          const operation = columnAggregates[column.id] ?? null;
          const display =
            sourceColumn && operation ? getAggregateDisplay(sourceColumn, rows) : null;
          const primaryText = display ?? "Calculate";
          const isActive = !!operation;

          return (
            <td
              key={column.id}
              className={`grid-calculate-footer__cell${isActive ? " is-active" : ""}${index === 0 ? " grid-calculate-footer__cell--inline-scope" : ""}`}
            >
              <button
                type="button"
                className={`grid-calculate-footer__trigger${activeColumnId === column.id ? " is-open" : ""}${isActive ? " is-active" : ""}`}
                aria-expanded={activeColumnId === column.id}
                title={primaryText}
                onClick={(event) => {
                  openColumnMenu(column.id, event.currentTarget, operation);
                }}
              >
                <span className="grid-calculate-footer__stat">
                  <span
                    className={`grid-calculate-footer__stat-value${!operation ? " is-placeholder" : ""}`}
                  >
                    {primaryText}
                  </span>
                </span>
              </button>
            </td>
          );
        })}
      </tr>

      {activeColumnId && activeSourceColumn && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="abrd-filter-engine grid-calculate-footer__panel grid-calculate-footer__panel--operation"
              style={{ left: menuPosition.left, top: menuPosition.top }}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="grid-calculate-footer__panel-header">
                <span className="grid-calculate-footer__panel-eyebrow">Calculate</span>
                <span className="grid-calculate-footer__panel-title" title={activeSourceColumn.label}>
                  {activeSourceColumn.label}
                </span>
              </div>

              <label className="grid-calculate-footer__field">
                <span className="grid-calculate-footer__panel-eyebrow">Operation</span>
                <span className="grid-calculate-footer__select-wrap">
                  <select
                    className="grid-calculate-footer__select"
                    value={pendingOperation}
                    onChange={(event) =>
                      setPendingOperation(event.target.value as AggregateOperation | "")
                    }
                  >
                    <option value="">Select calculation</option>
                    {operationsForColumn(activeSourceColumn).map((operation) => (
                      <option key={operation} value={operation}>
                        {AGGREGATE_LABELS[operation]}
                      </option>
                    ))}
                    {columnAggregates[activeColumnId] ? (
                      <option value="">Clear calculation</option>
                    ) : null}
                  </select>
                </span>
              </label>

              <div className="grid-calculate-footer__panel-actions">
                <button
                  type="button"
                  className="grid-calculate-footer__apply"
                  onClick={applyOperation}
                >
                  Calculate
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
