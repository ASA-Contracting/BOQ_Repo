import type { Theme } from "@simple-table/react";

/** Default interaction model — matches Simple Table infrastructure demo. */
export const DEFAULT_SIMPLE_TABLE_PROPS = {
  columnReordering: true,
  columnResizing: true,
  editColumns: true,
  selectableCells: true,
  useHoverRowBackground: true,
  columnBorders: true,
} as const;

export const DEFAULT_SIMPLE_TABLE_HEIGHT = "400px";

export function resolveSimpleTableTheme(resolvedTheme?: string): Theme {
  return resolvedTheme === "dark" ? "modern-dark" : "modern-light";
}
