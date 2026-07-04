"use client";

import * as React from "react";

export type FilterPanelApi = {
  openFilterPanel: (field?: string) => void;
  closeFilterPanel: () => void;
  isFilterPanelOpen: boolean;
};

export const FilterPanelContext = React.createContext<FilterPanelApi | null>(null);

export function useFilterPanel(): FilterPanelApi {
  const ctx = React.useContext(FilterPanelContext);
  if (!ctx) {
    throw new Error("useFilterPanel must be used within FilterPanelContext");
  }
  return ctx;
}
