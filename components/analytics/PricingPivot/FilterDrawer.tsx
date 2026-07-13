"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  usePricingPivotDataContext,
  usePricingPivotWorkspaceContext,
} from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { usePricingPivotFieldValues } from "@/components/analytics/PricingPivot/hooks/usePricingPivotFieldValues";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer } from "@/components/ui/drawer";
import { SearchInput } from "@/components/ui/search-input";
import {
  buildValueFilterFromSelection,
  getPivotField,
} from "@/lib/analytics/pivot-engine";

export function FilterDrawer() {
  const { fetchState } = usePricingPivotDataContext();
  const { ui, workspace, setFilterField, setValueFilter } = usePricingPivotWorkspaceContext();

  const field = ui.filterField;
  const fieldMeta = field ? getPivotField(field) : undefined;

  const fieldValuesQuery = useMemo(() => {
    if (!field) return null;
    return {
      field,
      valueFilter: workspace.valueFilter,
      gridSearch: ui.gridSearch,
    };
  }, [field, workspace.valueFilter, ui.gridSearch]);

  const { state: fieldValuesState } = usePricingPivotFieldValues(fieldValuesQuery);

  const options = fieldValuesState.status === "success" ? fieldValuesState.options : [];

  const [query, setQuery] = useState("");
  const [draftSelected, setDraftSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!field || options.length === 0) return;
    const included = new Set<string>();
    for (const option of options) {
      if (!option.excluded) included.add(option.value);
    }
    setDraftSelected(included);
    setQuery("");
  }, [field, options]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.value.toLowerCase().includes(normalized));
  }, [options, query]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 12,
  });

  const loading = fieldValuesState.status === "loading" || fetchState.status === "loading";

  return (
    <Drawer
      open={field != null}
      onClose={() => setFilterField(null)}
      title={`${fieldMeta?.label ?? field ?? "Field"} filter`}
      description="Include or exclude values for this dimension. Counts reflect the server dataset."
      size="lg"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setFilterField(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || options.length === 0}
            onClick={() => {
              if (!field) return;
              const allValues = options.map((option) => option.value);
              const nextFilter = { ...workspace.valueFilter };
              const built = buildValueFilterFromSelection(field, allValues, draftSelected);
              if (Object.keys(built).length === 0) {
                delete nextFilter[field];
              } else {
                nextFilter[field] = built[field] ?? {};
              }
              setValueFilter(nextFilter);
              setFilterField(null);
            }}
          >
            Apply filter
          </Button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search values…"
          inputSize="sm"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftSelected(new Set(filteredOptions.map((option) => option.value)))}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftSelected(new Set())}
          >
            Clear
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {draftSelected.size.toLocaleString()} selected
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading values…</p>
        ) : (
          <div ref={parentRef} className="max-h-[60vh] overflow-auto rounded-md border border-[#e6eaf0]">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const option = filteredOptions[virtualRow.index];
                if (!option) return null;
                const checked = draftSelected.has(option.value);
                return (
                  <label
                    key={option.value}
                    className="absolute inset-x-0 flex cursor-pointer items-center gap-3 border-b border-border/60 px-3 py-2 text-sm hover:bg-muted/40"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`,
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        setDraftSelected((current) => {
                          const copy = new Set(current);
                          if (next === true) copy.add(option.value);
                          else copy.delete(option.value);
                          return copy;
                        });
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {option.value || "—"}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {option.count.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
