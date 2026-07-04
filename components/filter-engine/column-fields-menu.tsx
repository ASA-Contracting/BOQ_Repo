"use client";

import {
  Calendar,
  ChevronDown,
  GripVertical,
  Hash,
  LayoutGrid,
  ListFilter,
  Search,
  Type,
  X,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import type { FilterableColumn } from "@/components/filter-engine/filterable-data-grid";
import type { ColumnLayoutApi } from "@/components/filter-engine/use-column-layout";
import type { FilterType } from "@/lib/filter-engine";
import { clampPopoverPosition } from "@/lib/tag-colors";
import { cn } from "@/lib/utils";

import "@/styles/abrd-column-fields-menu.css";

export type ColumnFieldsMenuProps<T> = {
  columns: FilterableColumn<T>[];
  layout: ColumnLayoutApi<T>;
};

const PANEL_WIDTH = 360;

function columnIcon(filterType: FilterType | undefined) {
  switch (filterType) {
    case "number":
      return Hash;
    case "date":
      return Calendar;
    case "select":
      return ListFilter;
    case "text":
    default:
      return Type;
  }
}

function chooserColumns<T>(columns: FilterableColumn<T>[]) {
  return columns.filter((column) => !column.filterOnly && !column.hideFromChooser);
}

export function ColumnFieldsMenu<T>({ columns, layout }: ColumnFieldsMenuProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [shownOpen, setShownOpen] = React.useState(true);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({});
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const fieldColumns = chooserColumns(columns);
  const columnById = React.useMemo(
    () => new Map(fieldColumns.map((column) => [column.id, column])),
    [fieldColumns],
  );

  const orderedFieldColumns = React.useMemo(
    () =>
      layout.order
        .map((id) => columnById.get(id))
        .filter((column): column is FilterableColumn<T> => !!column),
    [columnById, layout.order],
  );

  const filteredColumns = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedFieldColumns;
    return orderedFieldColumns.filter((column) => column.label.toLowerCase().includes(query));
  }, [orderedFieldColumns, search]);

  const dragEnabled = search.trim().length === 0;

  const visibleCount = orderedFieldColumns.filter((column) => !layout.hiddenIds.has(column.id)).length;
  const hasCustomLayout =
    visibleCount !== orderedFieldColumns.length ||
    layout.order.some((id, index) => id !== fieldColumns[index]?.id);

  const updatePanelPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const anchor = trigger.getBoundingClientRect();
    const popoverWidth = Math.min(PANEL_WIDTH, window.innerWidth - 24);
    const popoverHeight = panel?.offsetHeight ?? Math.min(window.innerHeight * 0.72, 560);
    const { top, left } = clampPopoverPosition(anchor, popoverWidth, popoverHeight);

    setPanelStyle({
      position: "fixed",
      top,
      left,
      width: popoverWidth,
      zIndex: 5000,
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;

    updatePanelPosition();
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handler);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handler);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setDragId(null);
      setOverId(null);
      return;
    }

    const frame = window.requestAnimationFrame(updatePanelPosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, filteredColumns.length, shownOpen, updatePanelPosition]);

  const finishDrag = React.useCallback(() => {
    setDragId(null);
    setOverId(null);
  }, []);

  const handleDrop = React.useCallback(
    (targetId: string) => {
      if (dragId && dragId !== targetId) {
        layout.moveColumn(dragId, targetId);
      }
      finishDrag();
    },
    [dragId, finishDrag, layout],
  );

  const panel = open ? (
    <div className="abrd-filter-engine">
      <div
        ref={panelRef}
        className="proj-column-fields-panel proj-column-fields-panel--portal"
        style={panelStyle}
        role="dialog"
        aria-label="Fields"
        onClick={(event) => event.stopPropagation()}
      >
      <div className="proj-column-fields-panel__head">
        <h3 className="proj-column-fields-panel__title">Fields</h3>
        <button
          type="button"
          className="proj-column-fields-panel__close"
          aria-label="Close fields panel"
          onClick={() => setOpen(false)}
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="proj-column-fields-search">
        <Search size={14} className="proj-column-fields-search__icon" aria-hidden />
        <input
          className="proj-column-fields-search__input"
          type="search"
          value={search}
          placeholder="Search for new or existing fields"
          aria-label="Search fields"
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className="proj-column-fields-search__reset"
          onClick={() => {
            layout.resetColumns();
            setSearch("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="proj-column-fields-section">
        <div className="proj-column-fields-section__head">
          <button
            type="button"
            className="proj-column-fields-section__toggle"
            aria-expanded={shownOpen}
            onClick={() => setShownOpen((current) => !current)}
          >
            <ChevronDown
              size={14}
              className={cn("proj-column-fields-section__chevron", !shownOpen && "is-collapsed")}
              aria-hidden
            />
            <span>Shown</span>
          </button>
          {visibleCount < orderedFieldColumns.length ? (
            <button
              type="button"
              className="proj-column-fields-section__action"
              onClick={() => layout.showAllColumns()}
            >
              Show all
            </button>
          ) : (
            <button
              type="button"
              className="proj-column-fields-section__action"
              onClick={() => layout.hideAllColumns()}
            >
              Hide all
            </button>
          )}
        </div>

        {shownOpen ? (
          <ul className="proj-column-fields-list" aria-label="Shown fields">
            {filteredColumns.length === 0 ? (
              <li className="proj-column-fields-empty">No fields match your search.</li>
            ) : (
              filteredColumns.map((column) => {
                const Icon = columnIcon(column.filterType);
                const isVisible = !layout.hiddenIds.has(column.id);
                const canToggle =
                  layout.canToggleColumn(column.id) || layout.hiddenIds.has(column.id);
                const isDragging = dragId === column.id;
                const isOver = overId === column.id && dragId !== column.id;

                return (
                  <li
                    key={column.id}
                    className={cn(
                      "proj-column-fields-item",
                      isDragging && "is-dragging",
                      isOver && "is-over",
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setOverId(column.id);
                    }}
                    onDragLeave={() => {
                      if (overId === column.id) setOverId(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(column.id);
                    }}
                  >
                    <button
                      type="button"
                      className="proj-column-fields-item__grip"
                      aria-label={`Reorder ${column.label}`}
                      draggable={dragEnabled}
                      disabled={!dragEnabled}
                      onDragStart={(event) => {
                        setDragId(column.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", column.id);
                      }}
                      onDragEnd={finishDrag}
                    >
                      <GripVertical size={14} aria-hidden />
                    </button>
                    <span className="proj-column-fields-item__icon" aria-hidden>
                      <Icon size={14} />
                    </span>
                    <span className="proj-column-fields-item__label">{column.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isVisible}
                      aria-label={`${isVisible ? "Hide" : "Show"} ${column.label}`}
                      className={cn("proj-fields-toggle", isVisible && "is-on")}
                      disabled={!canToggle}
                      onClick={() => layout.toggleColumnVisibility(column.id)}
                    >
                      <span className="proj-fields-toggle__thumb" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={menuRef} className={cn("proj-column-fields-menu", open && "is-open")}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "proj-cu-chip proj-column-fields-summary",
          (open || hasCustomLayout) && "is-active",
        )}
        aria-label="Columns"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <LayoutGrid size={16} aria-hidden />
        <span>Columns</span>
      </button>

      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
