"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  FilterX,
  SortAsc,
  SortDesc,
} from "lucide-react";
import * as React from "react";

import { ColumnFilterMenu } from "@/components/filter-engine/column-filter-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FilterColumnDef, SortDirection } from "@/lib/filter-engine";
import { getDistinctValues } from "@/lib/filter-engine";

export type ColumnHeaderMenuProps<T> = {
  column: FilterColumnDef<T>;
  label: React.ReactNode;
  data: T[];
  sortDirection?: SortDirection | null;
  isFiltered?: boolean;
  /** null = no in-filter active (all values selected); array = explicit in-filter selection */
  activeInSelection?: string[] | null;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onClearSort?: () => void;
  onApplyInFilter?: (values: string[]) => void;
  onClearFilter?: () => void;
};

export function ColumnHeaderMenu<T>({
  column,
  label,
  data,
  sortDirection = null,
  isFiltered = false,
  activeInSelection = null,
  onSortAsc,
  onSortDesc,
  onClearSort,
  onApplyInFilter,
  onClearFilter,
}: ColumnHeaderMenuProps<T>) {
  const filterable = column.filterable !== false;
  const sortable = column.sortable !== false;
  const distinctValues = React.useMemo(
    () => getDistinctValues(data, column.field, column),
    [column, data],
  );

  const filterOptions = distinctValues.map((value) => ({
    label: value,
    value,
    checked: activeInSelection === null ? true : activeInSelection.includes(value),
  }));

  const sortIcon =
    sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : sortDirection === "desc" ? (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    );

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {(sortable || filterable) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 gap-1 px-1.5 text-[11px] font-semibold uppercase tracking-wide",
                (isFiltered || sortDirection) && "text-primary",
              )}
              aria-label={`Filter and sort ${column.label}`}
            >
              {sortIcon}
              {isFiltered ? <Filter className="h-3 w-3 fill-primary/20" /> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {sortable ? (
              <>
                <DropdownMenuItem onClick={onSortAsc}>
                  <SortAsc className="h-4 w-4" />
                  Sort ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSortDesc}>
                  <SortDesc className="h-4 w-4" />
                  Sort descending
                </DropdownMenuItem>
                {sortDirection ? (
                  <DropdownMenuItem onClick={onClearSort}>
                    <ArrowUpDown className="h-4 w-4" />
                    Clear sort
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
            {sortable && filterable ? <DropdownMenuSeparator /> : null}
            {filterable ? (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Filter className="h-4 w-4" />
                    Filter values
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <ColumnFilterMenu
                      key={`${column.field}-${activeInSelection?.join("\u0000") ?? "all"}`}
                      options={filterOptions}
                      placeholder={`Search ${column.label.toLowerCase()}…`}
                      onChange={(values) => onApplyInFilter?.(values)}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {isFiltered ? (
                  <DropdownMenuItem onClick={onClearFilter}>
                    <FilterX className="h-4 w-4" />
                    Clear filter
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
