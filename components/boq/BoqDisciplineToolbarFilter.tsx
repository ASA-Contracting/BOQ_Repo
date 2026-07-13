"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { ColumnFilterMenu } from "@/components/filter-engine/column-filter-menu";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

type Props = {
  options: string[];
  /** null = all disciplines; [] = none; partial list = specific disciplines */
  selected: string[] | null;
  onChange: (selected: string[] | null) => void;
  loading?: boolean;
};

function formatSummaryLabel(
  options: string[],
  selected: string[] | null,
  loading: boolean,
): string {
  if (loading) {
    return "Loading…";
  }
  if (options.length === 0) {
    return "No disciplines";
  }
  if (selected === null) {
    return "All disciplines";
  }
  if (selected.length === 0) {
    return "None selected";
  }
  if (selected.length === 1) {
    return selected[0] ?? "All disciplines";
  }
  return `${selected.length} selected`;
}

export function BoqDisciplineToolbarFilter({
  options,
  selected,
  onChange,
  loading = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const active = selected !== null;
  const summary = formatSummaryLabel(options, selected, loading);

  const filterOptions = options.map((option) => ({
    label: option,
    value: option,
    checked: selected === null ? true : selected.includes(option),
  }));

  const handleChange = (values: string[]) => {
    if (values.length === 0) {
      onChange([]);
      return;
    }
    if (values.length === options.length) {
      onChange(null);
      return;
    }
    onChange(values);
  };

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <button
          type="button"
          className={cn(
            "boq-breakdown__discipline-select bml-discipline-select-trigger",
            active && "bml-discipline-select-trigger--active",
          )}
          aria-label={`Discipline filter (${summary})`}
          disabled={loading || options.length === 0}
        >
          <span className="bml-discipline-select-trigger__label">{summary}</span>
          <ChevronDown size={12} className="bml-discipline-select-trigger__chevron" aria-hidden />
        </button>
      </DropdownTrigger>
      <DropdownContent
        align="start"
        className="bml-discipline-select-menu border-0 bg-transparent p-0 shadow-none"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <ColumnFilterMenu
          options={filterOptions}
          placeholder="Search disciplines…"
          className="w-[min(15rem,calc(100vw-2rem))] max-w-none"
          onChange={handleChange}
        />
      </DropdownContent>
    </Dropdown>
  );
}
