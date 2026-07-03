/**
 * Shared interactive state class strings.
 * Import into CVA definitions — never duplicate focus/hover patterns.
 */

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const interactiveTransition = "transition-colors duration-150";

export const disabledState =
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

export const navItemBase = [
  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium",
  interactiveTransition,
  focusRing,
].join(" ");

export const navItemActive =
  "bg-sidebar-accent text-sidebar-accent-foreground";

export const navItemInactive =
  "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

export const tableRowHover = "hover:bg-muted/50";

export const treeRowBase = [
  "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm",
  interactiveTransition,
  focusRing,
].join(" ");

export const treeRowHover = "hover:bg-accent";

export const treeRowSelected = "bg-accent text-accent-foreground";

/** Precomputed indent steps — level * 14px + 6px base, no inline styles. */
export const TREE_DEPTH_CLASSES = [
  "pl-1.5",
  "pl-5",
  "pl-[2.125rem]",
  "pl-12",
  "pl-[3.875rem]",
  "pl-[4.875rem]",
  "pl-[5.875rem]",
  "pl-[6.875rem]",
  "pl-[7.875rem]",
  "pl-[8.875rem]",
  "pl-[9.875rem]",
  "pl-[10.875rem]",
] as const;

export function treeDepthPaddingClass(depth: number): string {
  return (
    TREE_DEPTH_CLASSES[Math.min(depth, TREE_DEPTH_CLASSES.length - 1)] ??
    TREE_DEPTH_CLASSES[TREE_DEPTH_CLASSES.length - 1]
  );
}

export const searchMatchHighlight =
  "rounded-sm bg-warning/30 px-0.5 text-warning-foreground";

export const inputBase = [
  "flex w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs",
  "placeholder:text-muted-foreground",
  interactiveTransition,
  focusRing,
  disabledState,
].join(" ");

export const controlHeight = {
  sm: "h-7 text-xs",
  md: "h-8 text-sm",
  lg: "h-9 text-sm",
} as const;
