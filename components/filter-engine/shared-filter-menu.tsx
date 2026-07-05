"use client";

import {
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Info,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { SearchSelect } from "@/components/filter-engine/search-select";
import { isInsideSearchSelectOverlay } from "@/components/filter-engine/search-select-overlay";
import type { FilterEngineState } from "@/components/filter-engine/use-filter-engine";
import type { useSavedFilters } from "@/components/filter-engine/use-saved-filters";
import type {
  FilterColumnDef,
  FilterJoin,
  FilterOperator,
  FilterRowState,
  SavedFilterDefinition,
} from "@/lib/filter-engine";
import {
  filterValuePlaceholder,
  getDefaultOperator,
  getDistinctValues,
  getOperatorOptions,
  isFilterComplete,
  operatorNeedsNoValue,
  operatorUsesFreeTextValue,
  valueUsesDropdown,
} from "@/lib/filter-engine";

type JoinOption = { value: FilterJoin; label: string };

const JOIN_OPTIONS: JoinOption[] = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
];

export type SharedFilterMenuProps<T> = {
  pageKey: string;
  columns: FilterColumnDef<T>[];
  data: T[];
  engine: FilterEngineState<T>;
  saved: ReturnType<typeof useSavedFilters>;
  captureViewState: () => SavedFilterDefinition | null;
  applyViewState: (definition: SavedFilterDefinition) => void;
};

export function SharedFilterMenu<T>({
  pageKey,
  columns,
  data,
  engine,
  saved,
  captureViewState,
  applyViewState,
}: SharedFilterMenuProps<T>) {
  const [savedPanelOpen, setSavedPanelOpen] = React.useState(false);
  const [savedFilterSearchTerm, setSavedFilterSearchTerm] = React.useState("");
  const [savedFilterSaveModeOpen, setSavedFilterSaveModeOpen] = React.useState(false);
  const [savedFilterName, setSavedFilterName] = React.useState("");
  const savedPanelRef = React.useRef<HTMLDivElement>(null);
  const savedTriggerRef = React.useRef<HTMLButtonElement>(null);

  const filterableColumns = columns.filter((column) => column.filterable !== false);
  const hasDetailedFilters = engine.filterGroups.length > 0;
  const hasFilterGroups = engine.filterGroups.length > 0;

  const canApply = engine.filterGroups.some((group) =>
    group.rows.some((row) => isFilterComplete(row.field, row.operator, row.value)),
  );

  const canSaveCurrent = captureViewState() != null;

  const filteredSaved = saved.items.filter((item) =>
    item.name.toLowerCase().includes(savedFilterSearchTerm.trim().toLowerCase()),
  );

  React.useEffect(() => {
    if (!savedPanelOpen) return;
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (savedPanelRef.current?.contains(target)) return;
      if (savedTriggerRef.current?.contains(target)) return;
      if (isInsideSearchSelectOverlay(target)) return;
      setSavedPanelOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [savedPanelOpen]);

  const savedTriggerLabel = saved.favorite?.name ?? "Saved views";

  const applySaved = (id: number) => {
    const item = saved.items.find((entry) => entry.id === id);
    if (!item) return;
    applyViewState(item.definition);
    saved.setActiveId(id);
    setSavedPanelOpen(false);
  };

  const handleSave = async () => {
    const definition = captureViewState();
    if (!definition || !savedFilterName.trim()) return;
    await saved.save(savedFilterName.trim(), definition);
    setSavedFilterSaveModeOpen(false);
    setSavedFilterName("");
  };

  return (
    <div
      className={`proj-menu-list proj-filter-menu-list abrd-shared-filter-menu${hasDetailedFilters ? " has-detailed-filters" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="proj-filter-head">
        <div className="proj-filter-title">
          <span>Filters</span>
          <Info size={12} aria-hidden />
        </div>

        <div className="proj-filter-head-actions">
          <button
            ref={savedTriggerRef}
            className="proj-filter-saved"
            type="button"
            aria-label="Saved views"
            aria-expanded={savedPanelOpen}
            aria-pressed={savedPanelOpen}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setSavedPanelOpen((open) => !open);
              void saved.load(true);
            }}
          >
            {saved.favorite ? <Star size={13} aria-hidden /> : null}
            <span>{savedTriggerLabel}</span>
            {savedPanelOpen ? <ChevronUp size={13} aria-hidden /> : <ChevronDown size={13} aria-hidden />}
          </button>

          {savedPanelOpen ? (
            <div
              ref={savedPanelRef}
              className="proj-saved-filters-panel"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <label className="proj-saved-filters-search-wrap">
                <Search size={13} aria-hidden />
                <input
                  className="proj-saved-filters-search"
                  type="search"
                  placeholder="Search..."
                  value={savedFilterSearchTerm}
                  onChange={(event) => setSavedFilterSearchTerm(event.target.value)}
                />
              </label>

              <div className="proj-saved-filters-body">
                <p className="proj-saved-filters-section-label">Personal</p>
                {saved.loading ? (
                  <p className="proj-saved-filters-empty">Loading your saved views...</p>
                ) : filteredSaved.length === 0 ? (
                  <p className="proj-saved-filters-empty">
                    {savedFilterSearchTerm.trim() ? "No matching saved views." : "No saved views yet."}
                  </p>
                ) : (
                  <div className="proj-saved-filters-list" role="list">
                    {filteredSaved.map((item) => (
                      <div
                        key={item.id}
                        className={`proj-saved-filter-item${saved.activeId === item.id ? " is-active" : ""}${item.isFavorite ? " is-favorite" : ""}`}
                        role="listitem"
                      >
                        <button
                          type="button"
                          className="proj-saved-filter-item-main"
                          aria-pressed={saved.activeId === item.id}
                          onClick={() => applySaved(item.id)}
                        >
                          <span className="proj-saved-filter-item-name">{item.name}</span>
                        </button>
                        <button
                          type="button"
                          className="proj-saved-filter-item-favorite"
                          aria-label={item.isFavorite ? "Remove default view" : "Set as default view"}
                          aria-pressed={item.isFavorite}
                          disabled={saved.busy}
                          onClick={() => void saved.setFavorite(item.id)}
                        >
                          <Star size={12} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="proj-saved-filter-item-delete"
                          aria-label="Delete saved view"
                          disabled={saved.busy}
                          onClick={() => void saved.remove(item.id)}
                        >
                          <Trash2 size={12} aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {saved.error ? (
                <p className="proj-saved-filters-feedback proj-saved-filters-feedback--error">{saved.error}</p>
              ) : savedFilterSaveModeOpen && !canSaveCurrent ? (
                <p className="proj-saved-filters-feedback">Adjust the grid before saving a view.</p>
              ) : null}

              <div className="proj-saved-filters-footer">
                {savedFilterSaveModeOpen ? (
                  <input
                    className="proj-saved-filters-name"
                    type="text"
                    placeholder="View name..."
                    value={savedFilterName}
                    onChange={(event) => setSavedFilterName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleSave();
                    }}
                  />
                ) : null}
                <button
                  className="proj-saved-filters-save-primary"
                  type="button"
                  disabled={
                    savedFilterSaveModeOpen &&
                    (!canSaveCurrent || saved.busy)
                  }
                  onClick={() => {
                    if (!savedFilterSaveModeOpen) {
                      setSavedFilterSaveModeOpen(true);
                      return;
                    }
                    void handleSave();
                  }}
                >
                  {saved.busy ? "Saving..." : savedFilterSaveModeOpen ? "Save view" : "Save new view"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="proj-filter-body">
        {hasFilterGroups ? (
          <div className="proj-filter-groups-shell">
            {engine.filterGroups.map((group, groupIndex) => (
              <FilterGroupBlock
                key={group.id}
                group={group}
                groupIndex={groupIndex}
                filterableColumns={filterableColumns}
                data={data}
                engine={engine}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="proj-filter-footer">
        <button className="proj-filter-add" type="button" onClick={engine.addToolbarFilter}>
          <Plus size={14} aria-hidden />
          <span>Add filter</span>
        </button>

        <div className="proj-filter-footer-actions">
          {engine.hasActiveFilters ? (
            <button className="proj-filter-clear-link" type="button" onClick={engine.clearAllFilters}>
              Clear all
            </button>
          ) : null}
          <button
            className="proj-filter-apply"
            type="button"
            disabled={!canApply}
            onClick={engine.applyToolbarFilters}
          >
            <CornerDownLeft size={14} aria-hidden />
            <span>Apply filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroupBlock<T>({
  group,
  groupIndex,
  filterableColumns,
  data,
  engine,
}: {
  group: { id: string; joinWithPrev: FilterJoin; rows: FilterRowState[] };
  groupIndex: number;
  filterableColumns: FilterColumnDef<T>[];
  data: T[];
  engine: FilterEngineState<T>;
}) {
  const nestedJoin = group.rows[1]?.joinWithPrev ?? "and";

  return (
    <div className="proj-filter-group">
      <div className="proj-filter-group-bridge">
        {groupIndex === 0 ? (
          <span className="proj-filter-group-shell-label">Where</span>
        ) : groupIndex === 1 ? (
          <div className="proj-filter-select-control proj-filter-join-select proj-filter-join-select--bridge">
            <SearchSelect
              compact
              options={JOIN_OPTIONS}
              value={JOIN_OPTIONS.find((option) => option.value === group.joinWithPrev) ?? JOIN_OPTIONS[0]}
              displayFn={(option) => option?.label ?? "AND"}
              placeholder="AND"
              noResultsText="No joins"
              overlayPanelClass="proj-filter-select-overlay proj-filter-select-overlay--compact"
              onValueChange={(option) => {
                if (!option) return;
                engine.setFilterGroups((current) =>
                  current.map((entry) =>
                    entry.id === group.id ? { ...entry, joinWithPrev: option.value } : entry,
                  ),
                );
              }}
            />
          </div>
        ) : (
          <span className="proj-filter-group-shell-label proj-filter-group-shell-label--muted">
            {nestedJoin === "or" ? "OR" : "AND"}
          </span>
        )}
      </div>

      <div className="proj-filter-group-box">
        <div className="proj-filter-group-content">
          {group.rows.map((filter, rowIndex) => (
            <FilterRowEditor
              key={filter.id}
              filter={filter}
              rowIndex={rowIndex}
              group={group}
              filterableColumns={filterableColumns}
              data={data}
              engine={engine}
            />
          ))}
        </div>

        <div className="proj-filter-group-actions">
          <button className="proj-filter-nested" type="button" onClick={() => engine.addNestedFilter(group.id)}>
            Add nested filter
          </button>
          {group.rows.length > 1 ? (
            <button
              className="proj-filter-clear-group"
              type="button"
              onClick={() => engine.clearFilterGroup(group.id)}
            >
              Clear group
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterRowEditor<T>({
  filter,
  rowIndex,
  group,
  filterableColumns,
  data,
  engine,
}: {
  filter: FilterRowState;
  rowIndex: number;
  group: { id: string; rows: FilterRowState[] };
  filterableColumns: FilterColumnDef<T>[];
  data: T[];
  engine: FilterEngineState<T>;
}) {
  const hasField = !!filter.field.trim();
  const column = filterableColumns.find((entry) => entry.field === filter.field);
  const filterType = column?.filterType ?? "text";
  const operatorOptions = getOperatorOptions(filterType);
  const fieldOptions = filterableColumns.map((entry) => ({
    field: entry.field,
    label: entry.label,
    filterType: entry.filterType ?? "text",
  }));
  const valueOptions = column
    ? getDistinctValues(data, column.field, column).map((value) => ({ value, label: value }))
    : [];
  const nestedJoin = group.rows[1]?.joinWithPrev ?? "and";
  const usesDropdown =
    hasField && valueUsesDropdown(filterType, filter.operator) && !operatorUsesFreeTextValue(filter.operator);

  return (
    <div
      className={`proj-filter-row${hasField ? " has-field" : ""}${rowIndex > 0 ? " has-prefix has-join" : ""}`}
    >
      {rowIndex > 0 ? (
        <div className="proj-filter-row-prefix">
          {rowIndex === 1 ? (
            <div className="proj-filter-select-control proj-filter-join-select">
              <SearchSelect
                compact
                options={JOIN_OPTIONS}
                value={JOIN_OPTIONS.find((option) => option.value === nestedJoin) ?? JOIN_OPTIONS[0]}
                displayFn={(option) => option?.label ?? "AND"}
                placeholder="AND"
                noResultsText="No joins"
                overlayPanelClass="proj-filter-select-overlay proj-filter-select-overlay--compact"
                onValueChange={(option) => {
                  if (!option) return;
                  engine.setFilterGroups((current) =>
                    current.map((entry) => ({
                      ...entry,
                      rows: entry.rows.map((row, index) =>
                        index === 1 ? { ...row, joinWithPrev: option.value } : row,
                      ),
                    })),
                  );
                }}
              />
            </div>
          ) : (
            <span className="proj-filter-join-display">{nestedJoin === "or" ? "OR" : "AND"}</span>
          )}
        </div>
      ) : null}

      <div className="proj-filter-select-control proj-filter-field-select">
        <SearchSelect
          options={fieldOptions}
          value={fieldOptions.find((option) => option.field === filter.field) ?? null}
          displayFn={(option) => option?.label ?? ""}
          placeholder="Search fields..."
          searchPlaceholder="Search fields..."
          noResultsText="No matching fields"
          onValueChange={(option) => {
            if (!option) return;
            engine.updateToolbarFilter(filter.id, {
              field: option.field,
              operator: getDefaultOperator(option.filterType),
              value: "",
            });
          }}
        />
      </div>

      {hasField ? (
        <>
          <div className="proj-filter-select-control proj-filter-operator-select">
            <SearchSelect
              options={operatorOptions}
              value={operatorOptions.find((option) => option.value === filter.operator) ?? operatorOptions[0]}
              displayFn={(option) => option?.label ?? ""}
              placeholder="Search operators..."
              searchPlaceholder="Search operators..."
              noResultsText="No operators"
              onValueChange={(option) => {
                if (!option) return;
                engine.updateToolbarFilter(filter.id, {
                  operator: option.value as FilterOperator,
                  value: operatorNeedsNoValue(option.value as FilterOperator) ? "" : filter.value,
                });
              }}
            />
          </div>

          {!operatorNeedsNoValue(filter.operator) ? (
            usesDropdown ? (
              <div className="proj-filter-select-control proj-filter-value-select">
                <SearchSelect
                  options={valueOptions}
                  value={valueOptions.find((option) => option.value === filter.value) ?? null}
                  displayFn={(option) => option?.label ?? ""}
                  placeholder="Search options..."
                  searchPlaceholder="Search options..."
                  noResultsText="No options"
                  onValueChange={(option) => {
                    engine.updateToolbarFilter(filter.id, { value: option?.value ?? "" });
                  }}
                />
              </div>
            ) : (
              <>
                <input
                  id={`page-design-filter-value-${filter.id}`}
                  name={`pageDesignFilterValue-${filter.id}`}
                  className="proj-filter-value"
                  type={filterType === "number" ? "number" : filterType === "date" ? "date" : "text"}
                  placeholder={filterValuePlaceholder(filterType, filter.operator, hasField)}
                  value={filter.value}
                  list={`page-design-filter-datalist-${filter.id}`}
                  onChange={(event) => engine.updateToolbarFilter(filter.id, { value: event.target.value })}
                />
                <datalist id={`page-design-filter-datalist-${filter.id}`}>
                  {valueOptions.map((option) => (
                    <option key={option.value} value={option.value} />
                  ))}
                </datalist>
              </>
            )
          ) : (
            <div className="proj-filter-value proj-filter-value--muted">No value needed</div>
          )}
        </>
      ) : null}

      <button
        className="proj-filter-remove"
        type="button"
        aria-label="Remove filter"
        onClick={() => engine.removeToolbarFilter(filter.id)}
      >
        <Trash2 size={12} aria-hidden />
      </button>
    </div>
  );
}
