"use client";

import { Filter, Search, X } from "lucide-react";
import * as React from "react";

import { SharedFilterMenu } from "@/components/filter-engine/shared-filter-menu";
import { isInsideSearchSelectOverlay } from "@/components/filter-engine/search-select-overlay";
import type { FilterEngineState } from "@/components/filter-engine/use-filter-engine";
import type { FilterColumnDef } from "@/lib/filter-engine";
import { isFilterComplete } from "@/lib/filter-engine";

import "@/styles/abrd-filter-toolbar.css";
import "@/styles/abrd-search-select.css";

export type FilterToolbarProps<T> = {
  pageKey: string;
  columns: FilterColumnDef<T>[];
  data: T[];
  engine: FilterEngineState<T>;
  searchPlaceholder?: string;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  toolbarAfterSearch?: React.ReactNode;
  filterPanelOpen?: boolean;
  onFilterPanelOpenChange?: (open: boolean) => void;
};

export function FilterToolbar<T>({
  pageKey,
  columns,
  data,
  engine,
  searchPlaceholder = "Search projects...",
  toolbarLeft,
  toolbarRight,
  toolbarAfterSearch,
  filterPanelOpen: controlledFilterPanelOpen,
  onFilterPanelOpenChange,
}: FilterToolbarProps<T>) {
  const [internalFilterPanelOpen, setInternalFilterPanelOpen] = React.useState(false);
  const filterPanelOpen = controlledFilterPanelOpen ?? internalFilterPanelOpen;
  const setFilterPanelOpen = React.useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(filterPanelOpen) : next;
      if (onFilterPanelOpenChange) onFilterPanelOpenChange(resolved);
      else setInternalFilterPanelOpen(resolved);
    },
    [filterPanelOpen, onFilterPanelOpenChange],
  );
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const filterMenuRef = React.useRef<HTMLDivElement>(null);

  const activeFilterCount =
    engine.columnFilters.filter((filter) => filter.operator !== "globalSearch").length +
    engine.filterGroups
      .flatMap((group) => group.rows)
      .filter((row) => isFilterComplete(row.field, row.operator, row.value)).length;

  const filterButtonActive = activeFilterCount > 0 || filterPanelOpen;
  const searchHasValue = !!engine.globalSearch.trim();

  React.useEffect(() => {
    if (!filterPanelOpen) return;
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current?.contains(target)) return;
      if (isInsideSearchSelectOverlay(target)) return;
      setFilterPanelOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [filterPanelOpen]);

  React.useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <div className="abrd-filter-engine">
      <div className="proj-page-tools" role="toolbar" aria-label="Table tools">
        <div className="proj-cu-chip-row">{toolbarLeft}</div>

        <div className="proj-page-tools__right">
          {toolbarRight}

          <div
            ref={filterMenuRef}
            className={`proj-menu proj-filter-menu${filterPanelOpen ? " is-open" : ""}`}
          >
            <button
              className={`proj-cu-chip proj-menu-summary proj-filter-summary${filterButtonActive ? " is-active" : ""}`}
              type="button"
              aria-label={`Filters (${activeFilterCount})`}
              aria-expanded={filterPanelOpen}
              aria-pressed={filterButtonActive}
              aria-haspopup="dialog"
              onClick={(event) => {
                event.stopPropagation();
                setFilterPanelOpen(!filterPanelOpen);
              }}
            >
              <Filter size={16} aria-hidden />
              <span>Filter</span>
              {activeFilterCount > 0 ? (
                <span className="proj-filter-summary-count">{activeFilterCount}</span>
              ) : null}
            </button>

            {filterPanelOpen ? (
              <SharedFilterMenu pageKey={pageKey} columns={columns} data={data} engine={engine} />
            ) : null}
          </div>

          <div
            className={`proj-toolbar-search${searchOpen ? " is-open" : ""}${searchHasValue ? " has-value" : ""}`}
          >
            <button
              className="proj-toolbar-icon proj-toolbar-search-toggle"
              type="button"
              aria-label="Toggle search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search size={16} aria-hidden />
            </button>
            {searchOpen ? (
              <>
                <input
                  ref={searchInputRef}
                  id="page-design-toolbar-search"
                  name="pageDesignToolbarSearch"
                  className="proj-toolbar-search-input"
                  type="search"
                  placeholder={searchPlaceholder}
                  value={engine.globalSearch}
                  onChange={(event) => engine.setGlobalSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                />
                {searchHasValue ? (
                  <button
                    className="proj-toolbar-search-clear"
                    type="button"
                    aria-label="Clear search"
                    onClick={() => engine.setGlobalSearch("")}
                  >
                    <X size={14} aria-hidden />
                  </button>
                ) : null}
              </>
            ) : null}
          </div>

          {toolbarAfterSearch}
        </div>
      </div>
    </div>
  );
}
