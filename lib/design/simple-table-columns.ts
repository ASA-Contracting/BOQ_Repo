import type { ReactHeaderObject } from "@simple-table/react";
import type * as React from "react";

import type { DataGridColumn } from "@/components/ui/data-grid";

function headerLabel(header: React.ReactNode, fallback: string): string {
  if (typeof header === "string") {
    return header;
  }
  if (typeof header === "number") {
    return String(header);
  }
  return fallback;
}

function hasCustomHeader(header: React.ReactNode): boolean {
  return typeof header !== "string" && typeof header !== "number";
}

export function toSimpleTableHeaders<T extends object>(columns: DataGridColumn<T>[]): ReactHeaderObject[] {
  return columns.map((column) => {
    const label = headerLabel(column.header, column.id);

    return {
      accessor: column.id,
      label,
      type: "other",
      width: column.width ?? "auto",
      minWidth: column.minWidth ?? 80,
      isSortable: column.sortable,
      align: column.align,
      headerRenderer: hasCustomHeader(column.header)
        ? () => column.header
        : undefined,
      cellRenderer: ({ row }) => column.cell(row as T),
    };
  });
}
