"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { GridCalculateFooter } from "@/components/filter-engine/grid-calculate-footer";
import {
  GridSelectionCell,
  GridSelectionHeaderCell,
} from "@/components/filter-engine/grid-selection-cell";
import type { GridGroupingState } from "@/components/filter-engine/use-grid-grouping";
import type { GridRowSelectionApi } from "@/hooks/use-grid-row-selection";
import {
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/typography";
import type { DataTableColumn, DataTableProps } from "@/components/ui/data-table";
import type { FilterColumnDef } from "@/lib/filter-engine";
import type { GroupBlock } from "@/lib/filter-engine/grouping";
import { cn } from "@/lib/utils";

import "@/styles/abrd-group-rows.css";

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function columnWidthStyle(width?: string): React.CSSProperties | undefined {
  if (!width) return undefined;
  return { width, minWidth: width, maxWidth: width };
}

export type GroupHeaderRenderProps<T> = {
  block: GroupBlock<T>;
  expanded: boolean;
  toggle: () => void;
};

export type GroupedDataTableProps<T> = DataTableProps<T> & {
  sourceColumns: FilterColumnDef<T>[];
  grouping: GridGroupingState<T>;
  renderGroupHeader?: (props: GroupHeaderRenderProps<T>) => React.ReactNode;
  selectable?: boolean;
  rowSelection?: GridRowSelectionApi;
  getRowSelectionNumber?: (row: T, displayIndex: number) => string | number;
  appendRow?: {
    key: string;
    label?: string;
    onActivate: () => void;
  };
};

function GroupFooterRow<T>({
  columns,
  sourceColumns,
  rows,
  grouping,
  hasSelectionColumn = false,
}: {
  columns: DataTableColumn<T>[];
  sourceColumns: FilterColumnDef<T>[];
  rows: T[];
  grouping: GridGroupingState<T>;
  hasSelectionColumn?: boolean;
}) {
  if (!grouping.hasActiveAggregates) return null;

  const sourceById = new Map(sourceColumns.map((column) => [column.id, column]));

  return (
    <TableRow className="group-footer-row hover:bg-transparent">
      {hasSelectionColumn ? <TableCell className="selection-cell" /> : null}
      {columns.map((column) => {
        const sourceColumn = sourceById.get(column.id);
        const operation = sourceColumn ? grouping.columnAggregates[sourceColumn.id] : null;
        const display =
          sourceColumn && operation ? grouping.getAggregateDisplay(sourceColumn, rows) : null;

        return (
          <TableCell
            key={column.id}
            className={cn(column.align && alignClass[column.align], column.className)}
          >
            {display ? (
              <span className="aggregate-value" data-aggregate={operation ?? undefined}>
                <span className="aggregate-number">{display}</span>
              </span>
            ) : null}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export function GroupedDataTable<T>({
  columns,
  sourceColumns,
  data,
  getRowKey,
  emptyMessage = "No results",
  className,
  stickyHeader = false,
  onRowClick,
  selectedRowKey,
  caption,
  "aria-label": ariaLabel,
  grouping,
  renderGroupHeader,
  selectable = false,
  rowSelection,
  getRowSelectionNumber,
  appendRow,
}: GroupedDataTableProps<T>) {
  const blocks = grouping.isGrouped ? grouping.buildBlocks(data) : [];
  const previousGroupFieldRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const field = grouping.primaryGroup?.field ?? null;
    if (!field || field === previousGroupFieldRef.current) return;
    previousGroupFieldRef.current = field;
    grouping.expandAllGroups(blocks.map((block) => block.key));
  }, [grouping.primaryGroup?.field, blocks.length]);

  const visibleKeys = React.useMemo(() => data.map((row) => getRowKey(row)), [data, getRowKey]);

  const renderSelectionCell = (row: T, displayIndex: number) => {
    if (!selectable || !rowSelection) return null;

    const rowKey = getRowKey(row);
    const rowNumber = getRowSelectionNumber
      ? getRowSelectionNumber(row, displayIndex)
      : displayIndex + 1;
    const selected = rowSelection.isSelected(rowKey);
    const hovered = rowSelection.hoveredKey === rowKey;

    return (
      <TableCell
        className={cn(
          "selection-cell",
          selected && "is-selected",
          hovered && "is-row-hovered",
        )}
        onMouseEnter={() => rowSelection.setHoveredKey(rowKey)}
        onMouseLeave={() => {
          if (rowSelection.hoveredKey === rowKey) {
            rowSelection.setHoveredKey(null);
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          rowSelection.toggle(rowKey);
        }}
      >
        <GridSelectionCell
          rowNumber={rowNumber}
          selected={selected}
          ariaLabel={`Select row ${rowNumber}`}
          onToggle={() => rowSelection.toggle(rowKey)}
        />
      </TableCell>
    );
  };

  const renderDataRow = (row: T, displayIndex: number, grouped = false) => {
    const rowKey = getRowKey(row);
    const isSelected = selectedRowKey === rowKey;
    const isCheckboxSelected = selectable && rowSelection?.isSelected(rowKey);

    return (
      <TableRow
        key={rowKey}
        data-state={isSelected || isCheckboxSelected ? "selected" : undefined}
        aria-selected={isSelected || isCheckboxSelected}
        tabIndex={onRowClick ? 0 : undefined}
        className={cn("data-row", grouped && "grouped-data-row", onRowClick && "cursor-pointer")}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={
          onRowClick
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row);
                }
              }
            : undefined
        }
      >
        {renderSelectionCell(row, displayIndex)}
        {columns.map((column) => (
          <TableCell
            key={column.id}
            style={columnWidthStyle(column.width)}
            className={cn(column.align && alignClass[column.align], column.className)}
          >
            {column.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const renderAppendRow = () => {
    if (!appendRow) return null;

    return (
      <TableRow
        key={appendRow.key}
        className="data-row append-row"
        onClick={appendRow.onActivate}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            appendRow.onActivate();
          }
        }}
      >
        {selectable ? <TableCell className="selection-cell is-append-row" /> : null}
        <TableCell colSpan={columns.length} className="append-row-cell">
          <span className="append-row-hint">{appendRow.label ?? "Click to add a new row…"}</span>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table
      className={cn("abrd-grouped-table", className)}
      scrollWrapper={!stickyHeader}
      aria-label={ariaLabel}
    >
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <colgroup>
        {selectable ? (
          <col
            style={{
              width: "var(--app-grid-selection-column-width, 44px)",
              minWidth: "var(--app-grid-selection-column-width, 44px)",
              maxWidth: "var(--app-grid-selection-column-width, 44px)",
            }}
          />
        ) : null}
        {columns.map((column) => (
          <col key={column.id} style={columnWidthStyle(column.width)} />
        ))}
      </colgroup>
      <TableHeader className={stickyHeader ? "sticky top-0 z-10" : undefined}>
        <TableRow className="hover:bg-transparent">
          {selectable && rowSelection ? (
            <TableHead scope="col" className="selection-cell abrd-grid-header-cell">
              <GridSelectionHeaderCell
                allSelected={rowSelection.allSelected(visibleKeys)}
                someSelected={rowSelection.someSelected(visibleKeys)}
                onToggleAll={() => rowSelection.toggleAllVisible(visibleKeys)}
              />
            </TableHead>
          ) : null}
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              style={columnWidthStyle(column.width)}
              className={cn(
                column.align && alignClass[column.align],
                column.headerClassName,
                stickyHeader && "abrd-grid-header-cell",
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody className={grouping.isGrouped ? "grouped-display-body" : undefined}>
        {data.length === 0 ? (
          <TableEmptyRow colSpan={columns.length + (selectable ? 1 : 0)}>
            <Text variant="muted" size="sm">
              {emptyMessage}
            </Text>
          </TableEmptyRow>
        ) : grouping.isGrouped ? (
          blocks.map((block) => {
            const expanded = grouping.expandedGroups.has(block.key);
            const toggle = () => grouping.toggleGroupExpanded(block.key);

            return (
              <React.Fragment key={block.key}>
                <TableRow
                  className={cn("group-row hover:bg-transparent", expanded && "is-expanded-group")}
                >
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="group-row-cell">
                    {renderGroupHeader ? (
                      renderGroupHeader({ block, expanded, toggle })
                    ) : (
                      <div
                        className="group-row-content"
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} group ${block.label}`}
                        onClick={toggle}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggle();
                          }
                        }}
                      >
                        <div className="group-row-main">
                          <span className="group-toggle" aria-hidden>
                            <ChevronDown
                              size={12}
                              className={cn("chevron transition-transform", !expanded && "-rotate-90")}
                            />
                          </span>
                          <div className="group-row-title">
                            <span className="group-row-pill tone-purple">
                              <span className="pill__label">{block.label}</span>
                            </span>
                            <span className="group-row-count">{block.rows.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>

                {expanded ? (
                  <>
                    {block.rows.map((row, index) => renderDataRow(row, index, true))}
                    <GroupFooterRow
                      columns={columns}
                      sourceColumns={sourceColumns}
                      rows={block.rows}
                      grouping={grouping}
                      hasSelectionColumn={selectable}
                    />
                  </>
                ) : null}
              </React.Fragment>
            );
          })
        ) : (
          <>
            {data.map((row, index) => renderDataRow(row, index))}
            {renderAppendRow()}
          </>
        )}
      </TableBody>

      <TableFooter className="grid-calculate-footer">
        <GridCalculateFooter
          columns={columns}
          sourceColumns={sourceColumns}
          columnAggregates={grouping.columnAggregates}
          getAggregateDisplay={grouping.getAggregateDisplay}
          rows={data}
          onSetAggregate={grouping.setColumnAggregate}
          hasSelectionColumn={selectable}
        />
      </TableFooter>
    </Table>
  );
}
