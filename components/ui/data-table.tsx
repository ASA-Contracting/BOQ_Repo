import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
  caption?: string;
  "aria-label"?: string;
};

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No results",
  className,
  stickyHeader = false,
  onRowClick,
  selectedRowKey,
  caption,
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  return (
    <Table className={className} aria-label={ariaLabel}>
      {caption ? (
        <caption className="sr-only">{caption}</caption>
      ) : null}
      <TableHeader className={stickyHeader ? "sticky top-0 z-10" : undefined}>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              className={cn(
                column.align && alignClass[column.align],
                column.headerClassName,
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableEmptyRow colSpan={columns.length}>
            <Text variant="muted" size="sm">
              {emptyMessage}
            </Text>
          </TableEmptyRow>
        ) : (
          data.map((row) => {
            const rowKey = getRowKey(row);
            const isSelected = selectedRowKey === rowKey;

            return (
              <TableRow
                key={rowKey}
                data-state={isSelected ? "selected" : undefined}
                aria-selected={isSelected}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.align && alignClass[column.align],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
