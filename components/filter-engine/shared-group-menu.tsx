"use client";

import { ChevronDown, ChevronUp, LayoutGrid, Trash2 } from "lucide-react";
import * as React from "react";

import type { FilterableColumn } from "@/components/filter-engine/filterable-data-grid";
import type { GridGroupingState } from "@/components/filter-engine/use-grid-grouping";
import type { SortDirection } from "@/lib/filter-engine";

import "@/styles/abrd-group-menu.css";

const ORDER_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

type SharedGroupMenuProps<T> = {
  grouping: GridGroupingState<T>;
  columns: FilterableColumn<T>[];
};

function InlineSelect({
  label,
  valueLabel,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  valueLabel: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      className="proj-inline-select"
      open={open}
      onToggle={(event) => {
        event.preventDefault();
        onOpenChange(!open);
      }}
    >
      <summary
        className="proj-inline-select-trigger"
        aria-label={label}
        onClick={(event) => event.preventDefault()}
      >
        <span className="proj-inline-select-value">{valueLabel}</span>
        <ChevronDown size={14} aria-hidden />
      </summary>
      <div className="proj-inline-select-list">{children}</div>
    </details>
  );
}

export function SharedGroupMenu<T>({ grouping, columns }: SharedGroupMenuProps<T>) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [fieldMenuOpen, setFieldMenuOpen] = React.useState(false);
  const [orderMenuOpen, setOrderMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const primary = grouping.selections[0] ?? { field: "", order: "asc" as SortDirection };
  const isSimpleMode = !grouping.isGrouped;
  const activeColumn =
    columns.find((column) => column.field === primary.field) ?? grouping.primaryColumn;

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
      setFieldMenuOpen(false);
      setOrderMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuOpen]);

  const selectField = (field: string) => {
    grouping.setPrimaryGroup(field, primary.order);
    setFieldMenuOpen(false);
  };

  const selectOrder = (order: SortDirection) => {
    grouping.updatePrimaryOrder(order);
    setOrderMenuOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className={`proj-menu proj-group-menu${menuOpen ? " is-open" : ""}`}
    >
      <button
        type="button"
        className={`proj-cu-chip proj-menu-summary${grouping.isGrouped ? " is-active" : ""}`}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <LayoutGrid size={16} className="proj-group-summary-icon" aria-hidden />
        <span>Group: {grouping.isGrouped ? grouping.groupLabel : "None"}</span>
      </button>

      {menuOpen ? (
        <div
          className={`proj-menu-list proj-group-menu-list${isSimpleMode ? " is-simple-mode" : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          {isSimpleMode ? (
            <div className="proj-group-simple-options">
              {grouping.groupOptions.map((column) => (
                <button
                  key={column.id}
                  type="button"
                  className={`proj-inline-select-item proj-group-simple-option${primary.field === column.field ? " active" : ""}`}
                  aria-pressed={primary.field === column.field}
                  onClick={() => selectField(column.field)}
                >
                  <span className="item-main">
                    <LayoutGrid size={14} aria-hidden />
                    <span>{column.label}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="proj-group-menu-label">Group by</div>
              <div className="proj-group-controls">
                <InlineSelect
                  label="Group field"
                  open={fieldMenuOpen}
                  onOpenChange={setFieldMenuOpen}
                  valueLabel={
                    <>
                      <LayoutGrid size={14} aria-hidden />
                      <span>{activeColumn?.label ?? "Select field"}</span>
                    </>
                  }
                >
                  {grouping.groupOptions.map((column) => (
                    <button
                      key={column.id}
                      type="button"
                      className={`proj-inline-select-item${primary.field === column.field ? " active" : ""}`}
                      aria-pressed={primary.field === column.field}
                      onClick={() => selectField(column.field)}
                    >
                      <span className="item-main">
                        <LayoutGrid size={14} aria-hidden />
                        <span>{column.label}</span>
                      </span>
                    </button>
                  ))}
                </InlineSelect>

                <InlineSelect
                  label="Group order"
                  open={orderMenuOpen}
                  onOpenChange={setOrderMenuOpen}
                  valueLabel={<span>{primary.order === "desc" ? "Descending" : "Ascending"}</span>}
                >
                  {ORDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`proj-inline-select-item${primary.order === option.value ? " active" : ""}`}
                      aria-pressed={primary.order === option.value}
                      onClick={() => selectOrder(option.value)}
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </InlineSelect>

                <button
                  type="button"
                  className="proj-group-reset"
                  title="Reset grouping"
                  onClick={() => {
                    grouping.clearGrouping();
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>

              {grouping.selections.length < grouping.groupOptions.length ? (
                <button
                  type="button"
                  className="proj-group-add-subgroup"
                  onClick={grouping.addGroupLevel}
                >
                  <span>+ Add group</span>
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ToggleAllGroupsChip<T>({
  grouping,
  data,
}: {
  grouping: GridGroupingState<T>;
  data: T[];
}) {
  if (!grouping.isGrouped) return null;

  const blocks = grouping.buildBlocks(data);
  if (blocks.length === 0) return null;

  const allExpanded = blocks.every((block) => grouping.expandedGroups.has(block.key));

  return (
    <button
      type="button"
      className={`proj-cu-chip${grouping.expandedGroups.size > 0 ? " is-active" : ""}`}
      aria-label={allExpanded ? "Collapse all groups" : "Expand all groups"}
      onClick={() => {
        if (allExpanded) {
          grouping.collapseAllGroups();
        } else {
          grouping.expandAllGroups(blocks.map((block) => block.key));
        }
      }}
    >
      {allExpanded ? (
        <>
          <ChevronUp size={16} aria-hidden />
          <span>Collapse all</span>
        </>
      ) : (
        <>
          <ChevronDown size={16} aria-hidden />
          <span>Expand all</span>
        </>
      )}
    </button>
  );
}
