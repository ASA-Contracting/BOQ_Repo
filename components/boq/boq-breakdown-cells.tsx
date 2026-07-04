"use client";

import { memo } from "react";
import { MoreHorizontal, Rows3, Trash2 } from "lucide-react";

import type { BoqItemRowDto } from "@/application/boq/dto";
import { BoqBreakdownCategoryPickerTrigger } from "@/components/boq/BoqBreakdownCategoryPickerHost";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import type { CategoryPickerOption } from "@/lib/category-picker-options";
import { cn } from "@/lib/utils";

import { displayCellValue, formatMasterNo } from "./boq-breakdown-utils";

type EditableCellProps = {
  value: string | null;
  onChange: (value: string) => void;
  align?: "left" | "right";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  monospace?: boolean;
  multiline?: boolean;
  readOnly?: boolean;
  ariaLabel: string;
};

export function BoqBreakdownEditableCell({
  value,
  onChange,
  align = "left",
  inputMode,
  monospace = false,
  multiline = false,
  readOnly = false,
  ariaLabel,
}: EditableCellProps) {
  if (multiline) {
    return (
      <textarea
        readOnly={readOnly}
        aria-label={ariaLabel}
        rows={2}
        className={cn(
          "bbd-cell-input bbd-cell-textarea",
          align === "right" && "bbd-cell-input--right",
          readOnly && "bbd-cell-input--readonly",
        )}
        value={displayCellValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      readOnly={readOnly}
      aria-label={ariaLabel}
      className={cn(
        "bbd-cell-input",
        align === "right" && "bbd-cell-input--right",
        monospace && "bbd-cell-input--mono",
        readOnly && "bbd-cell-input--readonly",
      )}
      value={displayCellValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function BoqBreakdownCalculatedCell({
  value,
  ariaLabel,
}: {
  value: string;
  ariaLabel: string;
}) {
  return (
    <span className="bbd-cell-calculated" aria-label={ariaLabel}>
      {displayCellValue(value)}
    </span>
  );
}

export function BoqBreakdownSectionBadge({ label }: { label?: string | null }) {
  const displayLabel = label?.trim();
  return (
    <span className="bbd-section-badge" title={displayLabel ?? undefined}>
      Section{displayLabel ? ` - ${displayLabel}` : ""}
    </span>
  );
}

type BoqBreakdownCategoryCellProps = {
  item: BoqItemRowDto;
  optionById: ReadonlyMap<number, CategoryPickerOption>;
};

function BoqBreakdownCategoryCellInner({
  item,
  optionById,
}: BoqBreakdownCategoryCellProps) {
  return <BoqBreakdownCategoryPickerTrigger item={item} optionById={optionById} />;
}

export const BoqBreakdownCategoryCell = memo(
  BoqBreakdownCategoryCellInner,
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.materialNodeId === next.item.materialNodeId &&
    prev.item.quantity === next.item.quantity &&
    prev.item.sectionParentLabel === next.item.sectionParentLabel &&
    prev.optionById === next.optionById,
);

export function BoqBreakdownMasterNoCell({ masterNo }: { masterNo: number | null }) {
  return (
    <span
      className={cn("bbd-master-no", masterNo == null && "bbd-master-no--manual")}
      aria-label={masterNo == null ? "Manual row" : `Original row ${masterNo}`}
    >
      {formatMasterNo(masterNo)}
    </span>
  );
}

type BoqBreakdownRowActionsProps = {
  itemId: number;
  disabled?: boolean;
  onInsertAbove: (itemId: number) => void;
  onInsertBelow: (itemId: number) => void;
  onDelete: (itemId: number) => void;
};

export function BoqBreakdownRowActions({
  itemId,
  disabled = false,
  onInsertAbove,
  onInsertBelow,
  onDelete,
}: BoqBreakdownRowActionsProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="bbd-row-action-btn"
          aria-label="Row actions"
          disabled={disabled}
        >
          <MoreHorizontal size={14} aria-hidden />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="bbd-row-actions-menu">
        <DropdownItem onSelect={() => onInsertAbove(itemId)}>
          <Rows3 size={14} aria-hidden />
          Insert row above
        </DropdownItem>
        <DropdownItem onSelect={() => onInsertBelow(itemId)}>
          <Rows3 size={14} aria-hidden />
          Insert row below
        </DropdownItem>
        <DropdownItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onDelete(itemId)}
        >
          <Trash2 size={14} aria-hidden />
          Delete row
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
