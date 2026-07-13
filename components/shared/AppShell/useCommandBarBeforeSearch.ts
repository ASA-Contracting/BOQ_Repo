"use client";

import * as React from "react";

import { useCommandBarSlot } from "@/components/shared/AppShell/AppShellContext";

export function useCommandBarBeforeSearch(content: React.ReactNode) {
  const { setCommandBarBeforeSearch } = useCommandBarSlot();

  React.useEffect(() => {
    setCommandBarBeforeSearch(content);
    return () => setCommandBarBeforeSearch(null);
  }, [content, setCommandBarBeforeSearch]);
}
