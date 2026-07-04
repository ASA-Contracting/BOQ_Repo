"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ListOrdered } from "lucide-react";

import type { BoqItemRowDto } from "@/application/boq/dto";
import {
  BoqBreakdownCalculatedCell,
  BoqBreakdownCategoryCell,
  BoqBreakdownEditableCell,
} from "@/components/boq/boq-breakdown-cells";
import { BoqBreakdownCategoryPickerHost } from "@/components/boq/BoqBreakdownCategoryPickerHost";
import {
  calcRowTotal,
  displayCellValue,
  formatMasterNo,
  patchBoqItemRow,
  withCalculatedTotal,
} from "@/components/boq/boq-breakdown-utils";
import {
  FilterableDataGrid,
  type FilterableColumn,
} from "@/components/filter-engine";
import { useGridRowSelection } from "@/hooks/use-grid-row-selection";
import {
  buildCategoryOptionById,
  withSectionPickerLabels,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";

const BREAKDOWN_COLUMN_WIDTHS: Record<string, string> = {
  category: "200px",
  itemNo: "88px",
  description: "360px",
  unit: "72px",
  quantity: "96px",
  rate: "96px",
  total: "96px",
};

type Props = {
  pageKey: string;
  items: BoqItemRowDto[];
  categoryOptions: CategoryPickerOption[];
  savingItemId?: number | null;
  rowActionPending?: boolean;
  onCategoryChange: (itemId: number, materialNodeId: number | null) => void;
  onItemsChange: (items: BoqItemRowDto[]) => void;
  onInsertRow: (relativeToItemId: number, position: "before" | "after") => void;
  onDeleteRows: (itemIds: number[]) => void | Promise<void>;
};

export function BoqBreakdownGrid({
  pageKey,
  items,
  categoryOptions,
  savingItemId = null,
  rowActionPending = false,
  onCategoryChange,
  onItemsChange,
  onInsertRow,
  onDeleteRows,
}: Props) {
  const rowSelection = useGridRowSelection();
  const [sortRequest, setSortRequest] = useState<{
    field: string;
    direction: "asc";
    nonce: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const optionById = useMemo(
    () => buildCategoryOptionById(categoryOptions),
    [categoryOptions],
  );
  const sectionPickerOptions = useMemo(
    () => withSectionPickerLabels(categoryOptions),
    [categoryOptions],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onItemsChangeRef = useRef(onItemsChange);
  onItemsChangeRef.current = onItemsChange;
  const onInsertRowRef = useRef(onInsertRow);
  onInsertRowRef.current = onInsertRow;
  const onDeleteRowsRef = useRef(onDeleteRows);
  onDeleteRowsRef.current = onDeleteRows;

  const updateItem = useCallback((rowId: number, patch: Partial<BoqItemRowDto>) => {
    onItemsChangeRef.current(patchBoqItemRow(itemsRef.current, rowId, patch));
  }, []);

  const restoreOriginalOrder = useCallback(() => {
    setSortRequest({ field: "masterNo", direction: "asc", nonce: Date.now() });
  }, []);

  const getRowSelectionNumber = useCallback((item: BoqItemRowDto, displayIndex: number) => {
    return item.masterNo ?? displayIndex + 1;
  }, []);

  const selectedItems = useMemo(() => {
    return items.filter((item) => rowSelection.selectedKeys.has(String(item.id)));
  }, [items, rowSelection.selectedKeys]);

  const handleCopyRows = useCallback(async () => {
    if (selectedItems.length === 0) return;
    const lines = selectedItems.map((item) =>
      [
        formatMasterNo(item.masterNo),
        item.itemNo ?? "",
        item.description ?? "",
        item.unit ?? "",
        item.quantity ?? "",
        item.rate ?? "",
      ].join("\t"),
    );
    await navigator.clipboard.writeText(lines.join("\n"));
    setStatusMessage("Copied");
  }, [selectedItems]);

  const handleCopyJson = useCallback(async () => {
    if (selectedItems.length === 0) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedItems, null, 2));
    setStatusMessage("JSON copied");
  }, [selectedItems]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = selectedItems.map((item) => item.id);
    if (ids.length === 0) return;

    const noun = ids.length === 1 ? "this row" : `${ids.length} rows`;
    if (!window.confirm(`Delete ${noun}? This cannot be undone.`)) {
      return;
    }

    rowSelection.recordSelectionUndo("Previous selection restored");
    await onDeleteRowsRef.current(ids);
    rowSelection.clear();
    setStatusMessage(ids.length === 1 ? "Row deleted" : `${ids.length} rows deleted`);
  }, [rowSelection, selectedItems]);

  const handleInsertRelativeToSelection = useCallback(
    (position: "before" | "after") => {
      const anchor = selectedItems[0] ?? items[items.length - 1];
      if (!anchor) return;
      onInsertRowRef.current(anchor.id, position);
    },
    [items, selectedItems],
  );

  const handleAppendRow = useCallback(() => {
    const anchor = items[items.length - 1];
    if (!anchor) return;
    onInsertRowRef.current(anchor.id, "after");
  }, [items]);

  const columns = useMemo((): FilterableColumn<BoqItemRowDto>[] => {
    return [
      {
        id: "masterNo",
        field: "masterNo",
        label: "#",
        filterType: "number",
        sortable: true,
        filterable: false,
        hideFromChooser: true,
        filterOnly: true,
        getValue: (item) => item.masterNo ?? Number.MAX_SAFE_INTEGER,
        header: "#",
        cell: () => null,
      },
      {
        id: "category",
        field: "categoryLabel",
        label: "Category",
        filterType: "select",
        searchable: true,
        getValue: (item) => item.categoryLabel ?? "",
        header: "Category",
        className: "bbd-col--category",
        headerClassName: "bbd-col--category",
        cell: (item) => (
          <BoqBreakdownCategoryCell item={item} optionById={optionById} />
        ),
      },
      {
        id: "itemNo",
        field: "itemNo",
        label: "Item",
        filterType: "text",
        searchable: true,
        header: "Item",
        className: "bbd-col--item",
        headerClassName: "bbd-col--item",
        cell: (item) => (
          <BoqBreakdownEditableCell
            value={item.itemNo}
            onChange={(value) => updateItem(item.id, { itemNo: value || null })}
            monospace
            ariaLabel={`Item number for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
      {
        id: "description",
        field: "description",
        label: "Description",
        filterType: "text",
        searchable: true,
        header: "Description",
        className: "bbd-col--description bbd-col--wrap",
        headerClassName: "bbd-col--description",
        cell: (item) => (
          <BoqBreakdownEditableCell
            value={item.description}
            onChange={(value) => updateItem(item.id, { description: value || null })}
            multiline
            ariaLabel={`Description for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
      {
        id: "unit",
        field: "unit",
        label: "UoM",
        filterType: "select",
        getValue: (item) => displayCellValue(item.unit),
        header: "UoM",
        className: "bbd-col--unit",
        headerClassName: "bbd-col--unit",
        cell: (item) => (
          <BoqBreakdownEditableCell
            value={item.unit}
            onChange={(value) => updateItem(item.id, { unit: value || null })}
            ariaLabel={`Unit for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
      {
        id: "quantity",
        field: "quantity",
        label: "Quantity",
        filterType: "number",
        align: "right",
        getValue: (item) => displayCellValue(item.quantity),
        header: "Quantity",
        className: "bbd-col--quantity",
        headerClassName: "bbd-col--quantity",
        cell: (item) => (
          <BoqBreakdownEditableCell
            value={item.quantity}
            onChange={(value) => updateItem(item.id, { quantity: value || null })}
            align="right"
            inputMode="decimal"
            ariaLabel={`Quantity for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
      {
        id: "rate",
        field: "rate",
        label: "Rate",
        filterType: "number",
        align: "right",
        getValue: (item) => displayCellValue(item.rate),
        header: "Rate",
        className: "bbd-col--rate",
        headerClassName: "bbd-col--rate",
        cell: (item) => (
          <BoqBreakdownEditableCell
            value={item.rate}
            onChange={(value) => updateItem(item.id, { rate: value || null })}
            align="right"
            inputMode="decimal"
            ariaLabel={`Rate for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
      {
        id: "total",
        field: "total",
        label: "Total",
        filterType: "number",
        align: "right",
        sortable: true,
        getValue: (item) => calcRowTotal(item.quantity, item.rate),
        header: "Total",
        className: "bbd-col--total",
        headerClassName: "bbd-col--total",
        cell: (item) => (
          <BoqBreakdownCalculatedCell
            value={calcRowTotal(item.quantity, item.rate)}
            ariaLabel={`Total for row ${item.masterNo ?? item.rowIndex}`}
          />
        ),
      },
    ];
  }, [optionById, updateItem]);

  const gridData = useMemo(() => items.map(withCalculatedTotal), [items]);

  return (
    <BoqBreakdownCategoryPickerHost
      items={items}
      categoryOptions={categoryOptions}
      sectionPickerOptions={sectionPickerOptions}
      savingItemId={savingItemId}
      onCategoryChange={onCategoryChange}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <FilterableDataGrid
          pageKey={pageKey}
          columns={columns}
          data={gridData}
          getRowKey={(item) => String(item.id)}
          emptyMessage="No rows match the current filters."
          shellClassName="border-0 bg-transparent shadow-none min-h-0 flex-1"
          className="boq-breakdown-grid-table text-sm"
          aria-label="BOQ breakdown grid"
          resizableColumns
          initialColumnWidths={BREAKDOWN_COLUMN_WIDTHS}
          initialColumnPins={{ category: "left" }}
          sortRequest={sortRequest}
          selectable
          rowSelection={rowSelection}
          getRowSelectionNumber={getRowSelectionNumber}
          appendRow={
            items.length > 0
              ? {
                  key: "append-row",
                  label: "Click to add a new row at the end…",
                  onActivate: handleAppendRow,
                }
              : undefined
          }
          selectionActionBar={{
            statusMessage,
            showEditAction: false,
            showExportAction: false,
            onCopy: () => void handleCopyRows(),
            onCopyJson: () => void handleCopyJson(),
            onDelete: () => void handleDeleteSelected(),
            onInsertAbove:
              selectedItems.length > 0 && !rowActionPending
                ? () => handleInsertRelativeToSelection("before")
                : undefined,
            onInsertBelow:
              selectedItems.length > 0 && !rowActionPending
                ? () => handleInsertRelativeToSelection("after")
                : undefined,
          }}
          toolbarActions={
            <button
              type="button"
              className="bbd-restore-order-btn"
              onClick={restoreOriginalOrder}
              title="Restore original import order"
              disabled={rowActionPending}
            >
              <ListOrdered size={14} aria-hidden />
              Original order
            </button>
          }
        />
      </div>
    </BoqBreakdownCategoryPickerHost>
  );
}
