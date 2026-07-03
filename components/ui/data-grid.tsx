"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
} from "@/components/ui/data-table";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export type DataGridColumn<T> = DataTableColumn<T> & {
  sortable?: boolean;
  sortKey?: string;
};

export type DataGridProps<T> = Omit<DataTableProps<T>, "columns"> & {
  columns: DataGridColumn<T>[];
  sortColumn?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
};

function SortButton({
  direction,
  onClick,
  label,
}: {
  direction?: SortDirection | null;
  onClick: () => void;
  label: string;
}) {
  const icon =
    direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : direction === "desc" ? (
      <ArrowDown className="h-3.5 w-3.5" />
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    );

  return (
    <IconButton
      label={`Sort by ${label}`}
      icon={icon}
      size="sm"
      variant="ghost"
      className="h-6 w-6"
      onClick={onClick}
    />
  );
}

export function DataGrid<T>({
  columns,
  data,
  getRowKey,
  sortColumn,
  sortDirection,
  onSortChange,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  ...props
}: DataGridProps<T>) {
  const allKeys = data.map(getRowKey);
  const allSelected =
    selectable &&
    allKeys.length > 0 &&
    allKeys.every((key) => selectedKeys?.has(key));

  const toggleAll = () => {
    if (!onSelectionChange) {
      return;
    }
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  };

  const gridColumns: DataTableColumn<T>[] = [
    ...(selectable
      ? [
          {
            id: "__select",
            header: (
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
            ),
            cell: (row: T) => {
              const key = getRowKey(row);
              return (
                <Checkbox
                  checked={selectedKeys?.has(key) ?? false}
                  onCheckedChange={(checked) => {
                    if (!onSelectionChange || !selectedKeys) {
                      return;
                    }
                    const next = new Set(selectedKeys);
                    if (checked === true) {
                      next.add(key);
                    } else {
                      next.delete(key);
                    }
                    onSelectionChange(next);
                  }}
                  aria-label={`Select row ${key}`}
                  onClick={(event) => event.stopPropagation()}
                />
              );
            },
            className: "w-10",
            headerClassName: "w-10",
          } satisfies DataTableColumn<T>,
        ]
      : []),
    ...columns.map((column) => ({
      ...column,
      header: column.sortable ? (
        <div className="flex items-center gap-1">
          <span>{column.header}</span>
          <SortButton
            label={String(column.header)}
            direction={
              sortColumn === (column.sortKey ?? column.id)
                ? sortDirection
                : null
            }
            onClick={() => {
              if (!onSortChange) {
                return;
              }
              const key = column.sortKey ?? column.id;
              const nextDirection: SortDirection =
                sortColumn === key && sortDirection === "asc" ? "desc" : "asc";
              onSortChange(key, nextDirection);
            }}
          />
        </div>
      ) : (
        column.header
      ),
      headerClassName: cn(column.headerClassName),
    })),
  ];

  return (
    <DataTable
      columns={gridColumns}
      data={data}
      getRowKey={getRowKey}
      selectedRowKey={
        props.selectedRowKey ??
        (selectedKeys?.size === 1 ? [...selectedKeys][0] : null)
      }
      {...props}
    />
  );
}
