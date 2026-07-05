import type { BoqItemRowDto } from "@/application/boq/dto";

export type BoqSummaryFilter = "all" | "sections" | "published" | "pending";

export function matchesBoqSummaryFilter(
  item: BoqItemRowDto,
  filter: BoqSummaryFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "sections":
      return item.isHeader;
    case "published":
      return item.isMeasurable && !item.isHeader && item.materialNodeId != null;
    case "pending":
      return item.isMeasurable && !item.isHeader && item.materialNodeId == null;
  }
}

export function filterBoqItemsBySummary(
  items: BoqItemRowDto[],
  filter: BoqSummaryFilter,
): BoqItemRowDto[] {
  if (filter === "all") {
    return items;
  }
  return items.filter((item) => matchesBoqSummaryFilter(item, filter));
}
import {
  resolveCategoryParentLabelFromMap,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";

export function isBlankCellValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  return value.trim() === "";
}

/** Rows with no quantity use section-style formatting in the breakdown grid. */
export function isSectionFormatRow(item: BoqItemRowDto): boolean {
  return isBlankCellValue(item.quantity);
}

export function displayCellValue(value: string | null | undefined): string {
  return isBlankCellValue(value) ? "" : value!.trim();
}

export function parseNumericCell(value: string | null | undefined): number | null {
  if (isBlankCellValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calcRowTotal(quantity: string | null, rate: string | null): string {
  const qty = parseNumericCell(quantity);
  const unitRate = parseNumericCell(rate);
  if (qty == null || unitRate == null) return "";
  const total = qty * unitRate;
  if (!Number.isFinite(total)) return "";
  return formatNumericTotal(total);
}

function formatNumericTotal(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

export function withCalculatedTotal(item: BoqItemRowDto): BoqItemRowDto {
  return {
    ...item,
    total: calcRowTotal(item.quantity, item.rate),
  };
}

export function patchBoqItemRow(
  items: BoqItemRowDto[],
  rowId: number,
  patch: Partial<BoqItemRowDto>,
): BoqItemRowDto[] {
  return items.map((item) => {
    if (item.id !== rowId) return item;
    const next = { ...item, ...patch };
    return withCalculatedTotal(next);
  });
}

export function insertBoqItemRowInOrder(
  items: BoqItemRowDto[],
  newItem: BoqItemRowDto,
  relativeToItemId: number,
  position: "before" | "after",
): BoqItemRowDto[] {
  const anchorIndex = items.findIndex((item) => item.id === relativeToItemId);
  if (anchorIndex < 0) {
    return [...items, withCalculatedTotal(newItem)];
  }

  const insertIndex = position === "before" ? anchorIndex : anchorIndex + 1;
  const next = [...items];
  next.splice(insertIndex, 0, withCalculatedTotal(newItem));
  return next;
}

export function removeBoqItemRow(items: BoqItemRowDto[], itemId: number): BoqItemRowDto[] {
  return items.filter((item) => item.id !== itemId);
}

/** Sort key for restoring import order; manual rows sort after imported rows. */
export function masterNoSortValue(masterNo: number | null): number {
  return masterNo ?? Number.MAX_SAFE_INTEGER;
}

export function formatMasterNo(masterNo: number | null): string {
  return masterNo == null ? "—" : String(masterNo);
}

/** Put category-tree parent on section-format rows directly above categorized children. */
export function applySectionParentLabels(
  items: BoqItemRowDto[],
  optionById: ReadonlyMap<number, CategoryPickerOption>,
): BoqItemRowDto[] {
  const result = items.map((item) => ({
    ...item,
    sectionParentLabel: null as string | null,
  }));

  let activeSectionIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (isSectionFormatRow(item)) {
      activeSectionIndex = i;
      if (item.materialNodeId != null) {
        result[i]!.sectionParentLabel = optionById.get(item.materialNodeId)?.label ?? null;
      }
      continue;
    }

    if (
      activeSectionIndex < 0 ||
      !item.isMeasurable ||
      item.materialNodeId == null ||
      items[activeSectionIndex]!.materialNodeId != null ||
      result[activeSectionIndex]!.sectionParentLabel != null
    ) {
      continue;
    }

    const inferred = resolveCategoryParentLabelFromMap(item.materialNodeId, optionById);
    if (inferred) {
      result[activeSectionIndex]!.sectionParentLabel = inferred;
    }
  }

  return result;
}
