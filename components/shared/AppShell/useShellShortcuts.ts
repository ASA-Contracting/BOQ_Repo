"use client";

import * as React from "react";

import { useAppShell } from "@/components/shared/AppShell/AppShellContext";

export function useShellShortcuts(): React.RefObject<HTMLInputElement | null> {
  const { toggleCollapsed, setMobileOpen } = useAppShell();
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (mod && event.key === "\\") {
        event.preventDefault();
        toggleCollapsed();
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === "[") {
        event.preventDefault();
        toggleCollapsed();
        return;
      }

      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMobileOpen, toggleCollapsed]);

  return searchRef;
}
