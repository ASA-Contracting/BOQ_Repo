/**
 * Design token reference for programmatic use (JS/TS).
 * Visual values live in app/globals.css — this file mirrors names only.
 */

export const layout = {
  sidebarWidth: "var(--sidebar-width)",
  topNavHeight: "var(--topnav-height)",
  toolbarHeight: "var(--toolbar-height)",
  spacePage: "var(--space-page)",
  spaceSection: "var(--space-section)",
  spaceInline: "var(--space-inline)",
} as const;

export const iconSize = {
  sm: "var(--icon-sm)",
  md: "var(--icon-md)",
  lg: "var(--icon-lg)",
} as const;

export const elevation = {
  0: "elevation-0",
  1: "elevation-1",
  2: "elevation-2",
  3: "elevation-3",
  4: "elevation-4",
  overlay: "elevation-overlay",
} as const;

export const duration = {
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
} as const;
