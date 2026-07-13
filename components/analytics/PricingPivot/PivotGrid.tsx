"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  usePricingPivotDataContext,
  usePricingPivotWorkspaceContext,
} from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { cn } from "@/lib/utils";

type GridRow = {
  id: string;
  rowLabel: string;
  cells: string[];
  rawCells: Array<number | null>;
  rowTotal?: string;
};

const DEFAULT_ROW_LABEL_WIDTH = 300;
const DEFAULT_DATA_WIDTH = 150;
const DEFAULT_NUMERIC_WIDTH = 140;
const DEFAULT_TOTAL_WIDTH = 180;

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function heatmapBackground(value: number | null, min: number, max: number): string | undefined {
  if (value == null || !Number.isFinite(value) || max <= min) return undefined;
  const t = (value - min) / (max - min);
  const low = { r: 224, g: 242, b: 254 };
  const high = { r: 37, g: 99, b: 235 };
  const r = lerpChannel(low.r, high.r, t);
  const g = lerpChannel(low.g, high.g, t);
  const b = lerpChannel(low.b, high.b, t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const PivotGrid = memo(function PivotGrid() {
  const { pivotResult } = usePricingPivotDataContext();
  const { ui } = usePricingPivotWorkspaceContext();
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const parentRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const rowHeight = ui.density === "compact" ? 26 : 32;

  const getColumnWidth = useCallback(
    (columnId: string, kind: "rowLabel" | "data" | "numeric" | "total") => {
      if (columnWidths[columnId]) return columnWidths[columnId];
      if (kind === "rowLabel") return DEFAULT_ROW_LABEL_WIDTH;
      if (kind === "total") return DEFAULT_TOTAL_WIDTH;
      if (kind === "numeric") return DEFAULT_NUMERIC_WIDTH;
      return DEFAULT_DATA_WIDTH;
    },
    [columnWidths],
  );

  const handleResizeStart = useCallback(
    (columnId: string, startX: number, kind: "rowLabel" | "data" | "numeric" | "total") => {
      resizeRef.current = {
        columnId,
        startX,
        startWidth: getColumnWidth(columnId, kind),
      };

      const onMove = (event: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = event.clientX - resizeRef.current.startX;
        const minWidth =
          kind === "rowLabel" ? 300 : kind === "total" ? 180 : kind === "numeric" ? 140 : 150;
        const next = Math.max(minWidth, resizeRef.current.startWidth + delta);
        setColumnWidths((current) => ({ ...current, [columnId]: next }));
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getColumnWidth],
  );

  const { rows, numericRange } = useMemo(() => {
    if (!pivotResult) {
      return { rows: [] as GridRow[], numericRange: { min: 0, max: 0 } };
    }

    const numerics: number[] = [];
    for (const row of pivotResult.cells) {
      for (const cell of row) {
        if (cell.raw != null) numerics.push(cell.raw);
      }
    }

    const min = numerics.length === 0 ? 0 : Math.min(...numerics);
    const max = numerics.length === 0 ? 0 : Math.max(...numerics);

    const gridRows: GridRow[] = pivotResult.rowLabels.map((label, rowIndex) => ({
      id: `row-${rowIndex}`,
      rowLabel: label || "—",
      cells: pivotResult.cells[rowIndex]?.map((cell) => cell.formatted) ?? [],
      rawCells: pivotResult.cells[rowIndex]?.map((cell) => cell.raw) ?? [],
      rowTotal: ui.showTotals ? pivotResult.rowTotals[rowIndex]?.formatted : undefined,
    }));

    return { rows: gridRows, numericRange: { min, max } };
  }, [pivotResult, ui.showTotals]);

  const columns = useMemo<ColumnDef<GridRow>[]>(() => {
    if (!pivotResult) return [];

    const defs: ColumnDef<GridRow>[] = [
      {
        id: "rowLabel",
        accessorKey: "rowLabel",
        header: "Row",
        cell: ({ getValue }) => {
          const text = String(getValue() ?? "—");
          return (
            <span className="block truncate" title={text}>
              {text}
            </span>
          );
        },
      },
      ...pivotResult.colLabels.map((label, index) => ({
        id: `col-${index}`,
        accessorFn: (row: GridRow) => row.cells[index] ?? "—",
        header: label || "—",
        cell: ({ row }: { row: { original: GridRow } }) => {
          const formatted = row.original.cells[index] ?? "—";
          const raw = row.original.rawCells[index] ?? null;
          const bg = ui.heatmapEnabled
            ? heatmapBackground(raw, numericRange.min, numericRange.max)
            : undefined;
          const cellId = `${row.original.id}:${index}`;
          return (
            <span
              className={cn(
                "block w-full truncate",
                selectedCell === cellId && "bg-[#bfdbfe]",
              )}
              style={bg ? { backgroundColor: bg } : undefined}
              title={formatted}
            >
              {formatted}
            </span>
          );
        },
      })),
    ];

    if (ui.showTotals) {
      defs.push({
        id: "rowTotal",
        accessorKey: "rowTotal",
        header: "Total",
        cell: ({ getValue }) => {
          const text = String(getValue() ?? "—");
          return (
            <span className="block w-full truncate" title={text}>
              {text}
            </span>
          );
        },
      });
    }

    return defs;
  }, [pivotResult, ui.showTotals, ui.heatmapEnabled, numericRange, selectedCell]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 16,
  });

  if (!pivotResult) {
    return (
      <div className="pi-pivot-table">
        <div className="pi-pivot-table__empty">
          Add at least one value field to render the pivot grid.
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="pi-pivot-table">
        <div className="pi-pivot-table__empty">
          No pivot rows match the current configuration.
        </div>
      </div>
    );
  }

  const headerGroup = table.getHeaderGroups()[0];

  return (
    <div
      className={cn(
        "pi-pivot-table",
        ui.density === "compact" ? "pi-pivot-table--compact" : "pi-pivot-table--comfortable",
      )}
    >
      <div ref={parentRef} className="pi-pivot-table__scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header, index) => {
                  const isRowLabel = index === 0;
                  const isTotal =
                    ui.showTotals && index === group.headers.length - 1;
                  const kind = isRowLabel
                    ? "rowLabel"
                    : isTotal
                      ? "total"
                      : "numeric";
                  const width = getColumnWidth(header.id, kind);

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        isRowLabel && "pi-col-row-label text-left",
                        !isRowLabel && !isTotal && "pi-col-data pi-col-numeric",
                        isTotal && "pi-col-total",
                      )}
                      style={{ width, minWidth: width, maxWidth: width }}
                    >
                      <div className="pi-pivot-table__th-inner">
                        <span
                          className="truncate"
                          title={
                            header.isPlaceholder
                              ? undefined
                              : String(header.column.columnDef.header ?? "")
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        <button
                          type="button"
                          className="pi-pivot-table__resize-handle"
                          aria-label={`Resize ${String(header.column.columnDef.header ?? "column")}`}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleResizeStart(header.id, event.clientX, kind);
                          }}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isRowLabel = index === 0;
                    const isTotal =
                      ui.showTotals && index === row.getVisibleCells().length - 1;
                    const kind = isRowLabel
                      ? "rowLabel"
                      : isTotal
                        ? "total"
                        : "numeric";
                    const width = getColumnWidth(cell.column.id, kind);

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          isRowLabel && "pi-col-row-label",
                          !isRowLabel && !isTotal && "pi-col-data pi-col-numeric",
                          isTotal && "pi-col-total",
                        )}
                        style={{ width, minWidth: width, maxWidth: width }}
                        onClick={() => {
                          if (!isRowLabel) setSelectedCell(`${row.id}:${index - 1}`);
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {ui.showTotals && headerGroup ? (
            <tfoot>
              <tr>
                <td
                  className="pi-col-row-label"
                  style={{
                    width: getColumnWidth("rowLabel", "rowLabel"),
                    minWidth: getColumnWidth("rowLabel", "rowLabel"),
                  }}
                >
                  Total
                </td>
                {pivotResult.colTotals.map((cell, index) => {
                  const colId = `col-${index}`;
                  const width = getColumnWidth(colId, "numeric");
                  return (
                    <td
                      key={`total-${index}`}
                      className="pi-col-data pi-col-numeric"
                      style={{ width, minWidth: width }}
                      title={cell.formatted}
                    >
                      {cell.formatted}
                    </td>
                  );
                })}
                <td
                  className="pi-col-total"
                  style={{
                    width: getColumnWidth("rowTotal", "total"),
                    minWidth: getColumnWidth("rowTotal", "total"),
                  }}
                  title={pivotResult.grandTotal.formatted}
                >
                  {pivotResult.grandTotal.formatted}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
});
