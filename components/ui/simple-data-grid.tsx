"use client";

import { SimpleTable } from "@simple-table/react";
import type {
  ReactHeaderObject,
  SimpleTableReactProps,
  TableAPI,
} from "@simple-table/react";
import { useTheme } from "next-themes";
import * as React from "react";

import {
  DEFAULT_SIMPLE_TABLE_HEIGHT,
  DEFAULT_SIMPLE_TABLE_PROPS,
  resolveSimpleTableTheme,
} from "@/lib/design/simple-table-defaults";
import { cn } from "@/lib/utils";

export type SimpleDataGridProps = Omit<
  SimpleTableReactProps,
  "defaultHeaders" | "rows" | "theme"
> & {
  defaultHeaders: ReadonlyArray<ReactHeaderObject>;
  rows: ReadonlyArray<object>;
  theme?: SimpleTableReactProps["theme"];
  /** When omitted, fills the parent (`100%`). Pass a pixel/rem height to cap the viewport. */
  height?: string | number;
};

export const SimpleDataGrid = React.forwardRef<TableAPI, SimpleDataGridProps>(
  function SimpleDataGrid(
    {
      className,
      height = "100%",
      theme: themeOverride,
      useOddEvenRowBackground = true,
      ...props
    },
    ref,
  ) {
    const { resolvedTheme } = useTheme();
    const theme = themeOverride ?? resolveSimpleTableTheme(resolvedTheme);

    return (
      <SimpleTable
        ref={ref}
        className={cn("boq-simple-table", className)}
        height={height}
        theme={theme}
        useOddEvenRowBackground={useOddEvenRowBackground}
        {...DEFAULT_SIMPLE_TABLE_PROPS}
        {...props}
      />
    );
  },
);

SimpleDataGrid.displayName = "SimpleDataGrid";

export { DEFAULT_SIMPLE_TABLE_HEIGHT, DEFAULT_SIMPLE_TABLE_PROPS };
export type { ReactHeaderObject, TableAPI };
