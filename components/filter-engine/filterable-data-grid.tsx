"use client";

import * as React from "react";

import {
  ColumnHeaderContextMenu,
  type ColumnHeaderContextMenuState,
} from "@/components/filter-engine/column-header-context-menu";
import { ColumnFieldsMenu } from "@/components/filter-engine/column-fields-menu";
import { ColumnHeaderMenu } from "@/components/filter-engine/column-header-menu";
import { ColumnResizeHandle } from "@/components/filter-engine/column-resize-handle";
import { FilterPanelContext } from "@/components/filter-engine/filter-panel-context";
import { FilterToolbar } from "@/components/filter-engine/filter-toolbar";
import { GroupedDataTable } from "@/components/filter-engine/grouped-data-table";
import { GridSelectionActionBar } from "@/components/filter-engine/grid-selection-action-bar";
import {
  SharedGroupMenu,
  ToggleAllGroupsChip,
} from "@/components/filter-engine/shared-group-menu";
import { useColumnLayout } from "@/components/filter-engine/use-column-layout";
import { useFilterEngine } from "@/components/filter-engine/use-filter-engine";
import { useGridGrouping } from "@/components/filter-engine/use-grid-grouping";
import { useSavedFilters } from "@/components/filter-engine/use-saved-filters";
import type { GridRowSelectionApi } from "@/hooks/use-grid-row-selection";
import {
  type DataTableColumn,
  type DataTableProps,
} from "@/components/ui/data-table";
import type { FilterColumnDef, SortDirection } from "@/lib/filter-engine";
import { applyGridViewState, captureGridViewState, getDistinctValues } from "@/lib/filter-engine";
import { cn } from "@/lib/utils";

export type GroupBlock<T> = {
  key: string;
  label: string;
  rows: T[];
};

export type GroupHeaderRenderProps<T> = {
  block: GroupBlock<T>;
  expanded: boolean;
  toggle: () => void;
};

export type FilterableColumn<T> = FilterColumnDef<T> & {
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  hideFromChooser?: boolean;
  /** Participates in filtering/grouping but not rendered as a table column. */
  filterOnly?: boolean;
};

export type FilterableDataGridProps<T> = Omit<DataTableProps<T>, "columns" | "data"> & {
  pageKey: string;
  columns: FilterableColumn<T>[];
  data: T[];
  toolbarTitle?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  toolbarAfterSearch?: React.ReactNode;
  shellClassName?: string;
  initialGroupField?: string;
  initialHiddenColumnIds?: string[];
  initialColumnWidths?: Record<string, string>;
  initialColumnPins?: Record<string, "left" | "right">;
  resizableColumns?: boolean;
  renderGroupHeader?: (props: GroupHeaderRenderProps<T>) => React.ReactNode;
  sortRequest?: { field: string; direction: SortDirection; nonce: number } | null;
  selectable?: boolean;
  rowSelection?: GridRowSelectionApi;
  getRowSelectionNumber?: (row: T, displayIndex: number) => string | number;
  appendRow?: {
    key: string;
    label?: string;
    onActivate: () => void;
  };
  selectionActionBar?: Omit<
    React.ComponentProps<typeof GridSelectionActionBar>,
    "selectedCount" | "undoAvailable" | "undoLabel" | "onClear" | "onUndo" | "onDismissUndo" | "onSelectVisible"
  >;
};

export function FilterableDataGrid<T>({
  pageKey,
  columns,
  data,
  getRowKey,
  toolbarTitle,
  toolbarActions,
  toolbarAfterSearch,
  emptyMessage = "No results",
  shellClassName,
  initialGroupField,
  initialHiddenColumnIds,
  initialColumnWidths,
  initialColumnPins,
  resizableColumns = false,
  renderGroupHeader,
  sortRequest = null,
  selectable = false,
  rowSelection,
  getRowSelectionNumber,
  appendRow,
  selectionActionBar,
  ...props
}: FilterableDataGridProps<T>) {
  const engine = useFilterEngine({ data, columns });
  const layout = useColumnLayout(columns, {
    initialHiddenColumnIds,
    initialWidthById: initialColumnWidths,
    initialPinById: initialColumnPins,
  });
  const grouping = useGridGrouping(columns, { initialGroupField });
  const saved = useSavedFilters(pageKey);
  const favoriteLoadedRef = React.useRef(false);
  const [contextMenu, setContextMenu] = React.useState<ColumnHeaderContextMenuState<T>>(null);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const pendingFilterFieldRef = React.useRef<string | undefined>(undefined);

  const getActiveInSelection = (field: string): string[] | null => {
    const filter = engine.columnFilters.find(
      (entry) => entry.field === field && entry.operator === "in",
    );
    if (!filter) {
      return null;
    }
    return Array.isArray(filter.value) ? filter.value.map(String) : [];
  };

  const applyColumnInFilter = (column: FilterableColumn<T>, values: string[]) => {
    const allValues = getDistinctValues(data, column.field, column);
    const shouldKeepFilter = allValues.length > 0 && values.length < allValues.length;
    if (!shouldKeepFilter) {
      engine.clearColumnFilter(column.field);
      return;
    }
    engine.setColumnFilter(column.field, "in", values);
  };

  const getSortDirection = (field: string): SortDirection | null =>
    engine.sorts.find((sort) => sort.field === field)?.direction ?? null;

  const openFilterPanel = React.useCallback((field?: string) => {
    pendingFilterFieldRef.current = field;
    setFilterPanelOpen(true);
  }, []);

  const closeFilterPanel = React.useCallback(() => {
    setFilterPanelOpen(false);
  }, []);

  React.useEffect(() => {
    if (!filterPanelOpen || !pendingFilterFieldRef.current) return;
    engine.openFilterForColumn(pendingFilterFieldRef.current);
    pendingFilterFieldRef.current = undefined;
  }, [engine, filterPanelOpen]);

  React.useEffect(() => {
    if (!sortRequest) return;
    engine.setSort(sortRequest.field, sortRequest.direction);
  }, [engine, sortRequest?.field, sortRequest?.direction, sortRequest?.nonce]);

  const captureViewState = React.useCallback(
    () => captureGridViewState(engine, layout, grouping),
    [engine, grouping, layout],
  );

  const applyViewState = React.useCallback(
    (definition: Parameters<typeof applyGridViewState>[0]) => {
      applyGridViewState(definition, engine, layout, grouping, columns);
    },
    [columns, engine, grouping, layout],
  );

  React.useEffect(() => {
    if (!pageKey || favoriteLoadedRef.current) return;
    favoriteLoadedRef.current = true;

    void (async () => {
      const items = await saved.load(true);
      const favorite = items.find((item) => item.isFavorite);
      if (!favorite) return;
      applyGridViewState(favorite.definition, engine, layout, grouping, columns);
      saved.setActiveId(favorite.id);
    })();
  }, [columns, engine, grouping, layout, pageKey, saved]);

  const tableColumns: DataTableColumn<T>[] = layout.visibleColumns.map((column) => {
    const pin = layout.pinById[column.id];
    const align = layout.alignById[column.id] ?? column.align ?? "left";
    const width = layout.widthById[column.id];

    return {
      id: column.id,
      width,
      className: cn(
        column.className,
        pin === "left" && "sticky left-0 z-[2] bg-[var(--app-color-grid-header-bg,rgb(252_252_252))] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]",
        pin === "right" && "sticky right-0 z-[2] bg-[var(--app-color-grid-header-bg,rgb(252_252_252))] shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.12)]",
      ),
      headerClassName: cn(
        column.headerClassName,
        pin === "left" && "sticky left-0 z-[3] bg-[var(--app-color-grid-header-bg,rgb(252_252_252))]",
        pin === "right" && "sticky right-0 z-[3] bg-[var(--app-color-grid-header-bg,rgb(252_252_252))]",
      ),
      align,
      header: (
        <div
          className="relative flex min-w-0 items-center pr-2"
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({ column, x: event.clientX, y: event.clientY });
          }}
        >
          <ColumnHeaderMenu
            column={column}
            label={column.header}
            data={data}
            sortDirection={getSortDirection(column.field)}
            isFiltered={engine.activeFilterFields.has(column.field)}
            activeInSelection={getActiveInSelection(column.field)}
            onSortAsc={() => engine.setSort(column.field, "asc")}
            onSortDesc={() => engine.setSort(column.field, "desc")}
            onClearSort={() => engine.setSort(column.field, null)}
            onApplyInFilter={(values) => applyColumnInFilter(column, values)}
            onClearFilter={() => engine.clearColumnFilter(column.field)}
          />
          {resizableColumns ? (
            <ColumnResizeHandle
              onCommit={(widthPx) => layout.setColumnWidth(column.id, `${Math.round(widthPx)}px`)}
            />
          ) : null}
        </div>
      ),
      cell: column.cell,
    };
  });

  const filterPanelApi = React.useMemo(
    () => ({
      openFilterPanel,
      closeFilterPanel,
      isFilterPanelOpen: filterPanelOpen,
    }),
    [closeFilterPanel, filterPanelOpen, openFilterPanel],
  );

  return (
    <FilterPanelContext.Provider value={filterPanelApi}>
      <div
        className={cn(
          "abrd-filter-engine flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card",
          shellClassName,
        )}
      >
        <FilterToolbar
          pageKey={pageKey}
          columns={columns}
          data={data}
          engine={engine}
          saved={saved}
          captureViewState={captureViewState}
          applyViewState={applyViewState}
          searchPlaceholder="Search records..."
          toolbarLeft={
            <>
              <SharedGroupMenu grouping={grouping} columns={columns} />
              <ColumnFieldsMenu columns={columns} layout={layout} />
              {toolbarTitle}
              <ToggleAllGroupsChip grouping={grouping} data={engine.displayData} />
            </>
          }
          toolbarRight={toolbarActions}
          toolbarAfterSearch={toolbarAfterSearch}
          filterPanelOpen={filterPanelOpen}
          onFilterPanelOpenChange={setFilterPanelOpen}
        />
        <div className="abrd-filter-engine__grid-shell min-h-0 flex-1 overflow-auto">
          <GroupedDataTable
            columns={tableColumns}
            sourceColumns={layout.visibleColumns}
            data={engine.displayData}
            getRowKey={getRowKey}
            emptyMessage={emptyMessage}
            stickyHeader
            grouping={grouping}
            renderGroupHeader={renderGroupHeader}
            selectable={selectable}
            rowSelection={rowSelection}
            getRowSelectionNumber={getRowSelectionNumber}
            appendRow={appendRow}
            {...props}
          />
          {selectable && rowSelection ? (
            <GridSelectionActionBar
              selectedCount={rowSelection.selectedKeys.size}
              undoAvailable={rowSelection.undoAvailable}
              undoLabel={rowSelection.undoLabel}
              onClear={rowSelection.clear}
              onUndo={rowSelection.undo}
              onDismissUndo={rowSelection.dismissUndo}
              onSelectVisible={() =>
                rowSelection.selectVisible(engine.displayData.map((row) => getRowKey(row)))
              }
              onSelectAllLoaded={() =>
                rowSelection.selectVisible(data.map((row) => getRowKey(row)))
              }
              onInvertSelection={() => {
                rowSelection.recordSelectionUndo("Previous selection restored");
                const visibleKeys = engine.displayData.map((row) => getRowKey(row));
                const next = new Set<string>();
                for (const key of visibleKeys) {
                  if (!rowSelection.selectedKeys.has(key)) {
                    next.add(key);
                  }
                }
                rowSelection.selectKeys([...next]);
              }}
              {...selectionActionBar}
            />
          ) : null}
        </div>
        <ColumnHeaderContextMenu
          menu={contextMenu}
          columns={columns}
          data={data}
          engine={engine}
          layout={layout}
          grouping={grouping}
          onClose={() => setContextMenu(null)}
        />
      </div>
    </FilterPanelContext.Provider>
  );
}
