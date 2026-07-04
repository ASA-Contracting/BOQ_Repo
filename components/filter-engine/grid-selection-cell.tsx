"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type GridSelectionHeaderCellProps = {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
};

export function GridSelectionHeaderCell({
  allSelected,
  someSelected,
  onToggleAll,
}: GridSelectionHeaderCellProps) {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [allSelected, someSelected]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="grid-checkbox"
      checked={allSelected}
      aria-label="Select visible rows"
      onChange={onToggleAll}
    />
  );
}

type GridSelectionCellProps = {
  rowNumber: string | number;
  selected: boolean;
  ariaLabel: string;
  onToggle: (event: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => void;
};

export function GridSelectionCell({
  rowNumber,
  selected,
  ariaLabel,
  onToggle,
}: GridSelectionCellProps) {
  return (
    <span className="selection-cell-layout">
      <span className="selection-row-index" aria-hidden>
        {rowNumber}
      </span>
      <span className="selection-row-checkbox">
        <input
          type="checkbox"
          className="grid-checkbox"
          checked={selected}
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggle}
        />
      </span>
    </span>
  );
}
