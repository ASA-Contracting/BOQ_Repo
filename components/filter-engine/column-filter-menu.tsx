"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type ColumnFilterOption = {
  label: string;
  value: string;
  checked: boolean;
};

export type ColumnFilterMenuProps = {
  options: ColumnFilterOption[];
  placeholder?: string;
  onChange: (selectedValues: string[]) => void;
  className?: string;
};

function getSearchTerms(rawTerm: string): string[] {
  return rawTerm
    .split(/[,;|]+/g)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAllSearchTerms(label: string, terms: string[]): boolean {
  const normalized = label.toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

export function ColumnFilterMenu({
  options,
  placeholder = "Search values…",
  onChange,
  className,
}: ColumnFilterMenuProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [localOptions, setLocalOptions] = React.useState(options);

  React.useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const terms = getSearchTerms(searchTerm);
  const hasActiveSearch = terms.length > 0;
  const filteredOptions = hasActiveSearch
    ? localOptions.filter((option) => matchesAllSearchTerms(option.label, terms))
    : localOptions;

  const selectedCount = localOptions.filter((option) => option.checked).length;

  const emitSelection = (nextOptions: ColumnFilterOption[]) => {
    onChange(nextOptions.filter((option) => option.checked).map((option) => option.value));
  };

  const allSelected = localOptions.length > 0 && localOptions.every((option) => option.checked);
  const someSelected = localOptions.some((option) => option.checked) && !allSelected;

  const selectAllChecked = hasActiveSearch
    ? filteredOptions.length > 0 &&
      filteredOptions.every((option) => option.checked) &&
      !localOptions.some((option) => !filteredOptions.includes(option) && option.checked)
    : allSelected;

  const selectAllIndeterminate = hasActiveSearch
    ? filteredOptions.length > 0 &&
      !selectAllChecked &&
      (filteredOptions.some((option) => option.checked) ||
        localOptions.some((option) => !filteredOptions.includes(option) && option.checked))
    : someSelected;

  const selectAllDisabled = hasActiveSearch
    ? filteredOptions.length === 0
    : localOptions.length === 0;

  const onSelectAllChange = (checked: boolean) => {
    if (hasActiveSearch) {
      const visible = new Set(filteredOptions);
      if (!visible.size) {
        return;
      }
      const next = localOptions.map((option) =>
        visible.has(option) ? { ...option, checked } : option,
      );
      setLocalOptions(next);
      emitSelection(next);
      return;
    }

    const next = localOptions.map((option) => ({ ...option, checked }));
    setLocalOptions(next);
    emitSelection(next);
  };

  const toggleOption = (value: string, checked: boolean) => {
    let next = localOptions.map((option) =>
      option.value === value ? { ...option, checked } : option,
    );

    if (
      hasActiveSearch &&
      checked === false &&
      filteredOptions.length > 0 &&
      next.filter((option) => option.checked).length === next.length - 1
    ) {
      const visible = new Set(filteredOptions);
      next = next.map((option) => ({ ...option, checked: visible.has(option) }));
    }

    setLocalOptions(next);
    emitSelection(next);
  };

  return (
    <div
      className={cn(
        "flex w-[min(280px,90vw)] max-h-[380px] flex-col overflow-hidden rounded-lg border border-primary/40 bg-popover text-popover-foreground shadow-lg",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={placeholder}
            className="focus-ring h-8 w-full rounded-md border border-input bg-background pl-7 pr-7 text-xs"
          />
          {searchTerm ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
          {selectedCount} / {localOptions.length}
        </span>
      </div>

      <div className="border-b border-border px-3 py-2">
        <label
          className="flex items-center gap-2 text-xs font-semibold"
          onPointerDown={(event) => event.preventDefault()}
        >
          <Checkbox
            checked={
              selectAllIndeterminate ? "indeterminate" : selectAllChecked
            }
            disabled={selectAllDisabled}
            onCheckedChange={(checked) => onSelectAllChange(checked === true)}
          />
          <span>(Select all)</span>
        </label>
      </div>

      <div className="max-h-64 overflow-y-auto px-2 py-2">
        {filteredOptions.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">No matching values</div>
        ) : (
          filteredOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "mb-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
                option.checked && "bg-primary/10 text-primary",
              )}
              onPointerDown={(event) => event.preventDefault()}
            >
              <Checkbox
                checked={option.checked}
                onCheckedChange={(checked) => toggleOption(option.value, checked === true)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
