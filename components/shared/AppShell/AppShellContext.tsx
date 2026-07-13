"use client";

import * as React from "react";

const STORAGE_COLLAPSED = "boq:shell-sidebar-collapsed";
const STORAGE_WIDTH = "boq:shell-sidebar-width";

const DEFAULT_WIDTH = 216;
const MIN_WIDTH = 176;
const MAX_WIDTH = 288;
const COLLAPSED_WIDTH = 48;

type AppShellContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
  commandBarBeforeSearch: React.ReactNode;
  setCommandBarBeforeSearch: (content: React.ReactNode) => void;
};

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
}

function readStoredWidth(): number {
  if (typeof window === "undefined") {
    return DEFAULT_WIDTH;
  }

  const raw = window.localStorage.getItem(STORAGE_WIDTH);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (Number.isNaN(parsed)) {
    return DEFAULT_WIDTH;
  }

  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
}

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = React.useState(false);
  const [sidebarWidth, setSidebarWidthState] = React.useState(DEFAULT_WIDTH);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [commandBarBeforeSearch, setCommandBarBeforeSearchState] =
    React.useState<React.ReactNode>(null);

  const setCommandBarBeforeSearch = React.useCallback((content: React.ReactNode) => {
    setCommandBarBeforeSearchState(() => content);
  }, []);

  React.useEffect(() => {
    setCollapsedState(readStoredBoolean(STORAGE_COLLAPSED, false));
    setSidebarWidthState(readStoredWidth());
    setHydrated(true);
  }, []);

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    window.localStorage.setItem(STORAGE_COLLAPSED, String(value));
    if (value) {
      setMobileOpen(false);
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const setSidebarWidth = React.useCallback((width: number) => {
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
    setSidebarWidthState(next);
    window.localStorage.setItem(STORAGE_WIDTH, String(next));
  }, []);

  const toggleMobileOpen = React.useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const value = React.useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      sidebarWidth: hydrated ? sidebarWidth : DEFAULT_WIDTH,
      setSidebarWidth,
      mobileOpen,
      setMobileOpen,
      toggleMobileOpen,
      commandBarBeforeSearch,
      setCommandBarBeforeSearch,
    }),
    [
      collapsed,
      hydrated,
      mobileOpen,
      setCollapsed,
      setSidebarWidth,
      sidebarWidth,
      toggleCollapsed,
      toggleMobileOpen,
      commandBarBeforeSearch,
      setCommandBarBeforeSearch,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return context;
}

export function useCommandBarSlot(): Pick<
  AppShellContextValue,
  "commandBarBeforeSearch" | "setCommandBarBeforeSearch"
> {
  const { commandBarBeforeSearch, setCommandBarBeforeSearch } = useAppShell();
  return { commandBarBeforeSearch, setCommandBarBeforeSearch };
}

export {
  COLLAPSED_WIDTH,
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MIN_WIDTH,
};
