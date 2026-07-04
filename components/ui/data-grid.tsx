"use client";

import * as React from "react";

import {
  SimpleDataGrid,
  type ReactHeaderObject,
  type TableAPI,
} from "@/components/ui/simple-data-grid";
import type { DataTableProps } from "@/components/ui/data-table";
import { toSimpleTableHeaders } from "@/lib/design/simple-table-columns";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export type DataGridColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortKey?: string;
};

export type DataGridProps<T extends object> = Omit<DataTableProps<T>, "columns" | "stickyHeader"> & {
  columns: DataGridColumn<T>[];
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  height?: string | number;
  tableRef?: React.Ref<TableAPI>;
};

export function DataGrid<T extends object>({
  columns,
  data,
  getRowKey,
  sortColumn,
  sortDirection,
  onSortChange,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  emptyMessage = "No results",
  className,
  onRowClick,
  selectedRowKey,
  height,
  tableRef,
  "aria-label": ariaLabel,
}: DataGridProps<T>) {
  const headers = React.useMemo(
    () => toSimpleTableHeaders(columns),
    [columns],
  );

  const handleSortChange = React.useCallback(
    (sort: { key: { accessor: string }; direction: SortDirection } | null) => {
      if (!onSortChange || !sort) {
        return;
      }
      onSortChange(String(sort.key.accessor), sort.direction);
    },
    [onSortChange],
  );

  const handleRowSelectionChange = React.useCallback(
    ({ selectedRows }: { selectedRows: Set<string> }) => {
      onSelectionChange?.(selectedRows);
    },
    [onSelectionChange],
  );

  const emptyStateRenderer = React.useCallback(
    () => <span className="text-sm text-muted-foreground">{emptyMessage}</span>,
    [emptyMessage],
  );

  return (
    <div aria-label={ariaLabel} className={cn("h-full min-h-0", className)}>
      <SimpleDataGrid
        ref={tableRef}
        defaultHeaders={headers as ReactHeaderObject[]}
        rows={data}
        height={height}
        getRowId={({ row }) => getRowKey(row as T)}
        externalSortHandling={Boolean(onSortChange)}
        initialSortColumn={sortColumn ?? undefined}
        initialSortDirection={sortDirection}
        onSortChange={handleSortChange}
        enableRowSelection={selectable}
        onRowSelectionChange={selectable ? handleRowSelectionChange : undefined}
        emptyStateRenderer={emptyStateRenderer}
        onCellClick={
          onRowClick
            ? ({ row }) => {
                onRowClick(row as T);
              }
            : undefined
        }
      />
    </div>
  );
}
