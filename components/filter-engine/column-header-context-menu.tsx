"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Filter,
  LayoutGrid,
  Pin,
  Search,
  X,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { useFilterPanel } from "@/components/filter-engine/filter-panel-context";
import type { FilterableColumn } from "@/components/filter-engine/filterable-data-grid";
import type { ColumnLayoutApi, ColumnPin } from "@/components/filter-engine/use-column-layout";
import type { FilterEngineState } from "@/components/filter-engine/use-filter-engine";
import {
  copyTextToClipboard,
  estimateColumnWidth,
  formatStatValue,
  getColumnCopyValues,
  getColumnStatsSummary,
  getTopBottomFilterValues,
  isNumericColumn,
} from "@/lib/filter-engine/column-menu-helpers";
import type { GridGroupingState } from "@/components/filter-engine/use-grid-grouping";
import type { FilterColumnDef, SortDirection } from "@/lib/filter-engine";

import "@/styles/abrd-column-context-menu.css";

export type ColumnHeaderContextMenuState<T> = {
  column: FilterableColumn<T>;
  x: number;
  y: number;
} | null;

type SubmenuKey =
  | "sort"
  | "filter"
  | "pin"
  | "align"
  | "stats"
  | "visibility"
  | "choose"
  | "copy";

type ColumnHeaderContextMenuProps<T> = {
  menu: ColumnHeaderContextMenuState<T>;
  columns: FilterableColumn<T>[];
  data: T[];
  engine: FilterEngineState<T>;
  layout: ColumnLayoutApi<T>;
  grouping: GridGroupingState<T>;
  onClose: () => void;
};

function useSubmenuPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  submenuRef: React.RefObject<HTMLElement | null>,
) {
  const [openLeft, setOpenLeft] = React.useState(false);
  const [openUp, setOpenUp] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const submenuWidth = submenuRef.current?.offsetWidth ?? 200;
    const submenuHeight = submenuRef.current?.offsetHeight ?? 260;
    setOpenLeft(anchor.right + submenuWidth + 16 > window.innerWidth);
    setOpenUp(anchor.top + submenuHeight > window.innerHeight);
  }, [anchorRef, open, submenuRef]);

  return { openLeft, openUp };
}

function MenuIcon({ children }: { children: React.ReactNode }) {
  return <span className="menu-icon">{children}</span>;
}

function ContextMenuItem({
  children,
  className,
  disabled,
  active,
  onClick,
  onMouseEnter,
  itemRef,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  itemRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={itemRef}
      type="button"
      className={`context-menu-item${className ? ` ${className}` : ""}${active ? " active" : ""}${disabled ? " disabled" : ""}`}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </button>
  );
}

function ContextMenuSubmenuRow({
  children,
  submenu,
  className,
  disabled,
  itemRef,
  onOpen,
}: {
  children: React.ReactNode;
  submenu: React.ReactNode;
  className?: string;
  disabled?: boolean;
  itemRef?: React.Ref<HTMLButtonElement>;
  onOpen: (event: React.MouseEvent) => void;
}) {
  return (
    <div className={`context-menu-item-wrap has-submenu${className ? ` ${className}` : ""}`}>
      <ContextMenuItem
        disabled={disabled}
        itemRef={itemRef}
        onMouseEnter={(event) => !disabled && onOpen(event)}
        onClick={(event) => !disabled && onOpen(event)}
      >
        {children}
      </ContextMenuItem>
      {submenu}
    </div>
  );
}

function SubmenuArrow() {
  return (
    <MenuIcon>
      <ChevronRight className="h-3 w-3 submenu-arrow" />
    </MenuIcon>
  );
}

export function ColumnHeaderContextMenu<T>({
  menu,
  columns,
  data,
  engine,
  layout,
  grouping,
  onClose,
}: ColumnHeaderContextMenuProps<T>) {
  const filterPanel = useFilterPanel();
  const [activeSubmenu, setActiveSubmenu] = React.useState<SubmenuKey | null>(null);
  const [columnSearch, setColumnSearch] = React.useState("");
  const menuRef = React.useRef<HTMLDivElement>(null);
  const submenuAnchorRef = React.useRef<HTMLButtonElement>(null);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const chooseSubmenuRef = React.useRef<HTMLDivElement>(null);

  const column = menu?.column ?? null;
  const sortDirection =
    column && engine.sorts.find((sort) => sort.field === column.field)?.direction
      ? (engine.sorts.find((sort) => sort.field === column.field)!.direction as SortDirection)
      : null;
  const isFiltered = column ? engine.activeFilterFields.has(column.field) : false;
  const sortable = column?.sortable !== false;
  const filterable = column?.filterable !== false;
  const isGrouped = column ? grouping.primaryGroup?.field === column.field : false;
  const pin = column ? layout.pinById[column.id] ?? null : null;
  const align = column ? layout.alignById[column.id] ?? column.align ?? "left" : "left";

  const submenuPos = useSubmenuPosition(!!activeSubmenu, submenuAnchorRef, submenuRef);

  React.useEffect(() => {
    if (!menu) {
      setActiveSubmenu(null);
      setColumnSearch("");
    }
  }, [menu]);

  React.useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, onClose]);

  if (!menu || !column || typeof document === "undefined") return null;

  const stats = getColumnStatsSummary(data, column);
  const filteredColumns = layout.orderedColumns.filter((item) => {
    const label = String(item.label ?? item.header ?? item.field).toLowerCase();
    return label.includes(columnSearch.trim().toLowerCase());
  });
  const visibleCount = layout.visibleColumns.length;

  const showSubmenu = (key: SubmenuKey, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setActiveSubmenu(key);
    if (event?.currentTarget instanceof HTMLButtonElement) {
      submenuAnchorRef.current = event.currentTarget;
    }
  };

  const closeMenu = () => {
    onClose();
    setActiveSubmenu(null);
  };

  const renderSubmenu = (key: SubmenuKey, content: React.ReactNode, className = "") => {
    if (activeSubmenu !== key) return null;
    return (
      <div
        ref={submenuRef}
        className={`context-submenu column-context-submenu${submenuPos.openLeft ? " open-left" : ""}${submenuPos.openUp ? " open-up" : ""}${className ? ` ${className}` : ""}`}
        data-submenu={key}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseEnter={() => setActiveSubmenu(key)}
      >
        {content}
      </div>
    );
  };

  return createPortal(
    <div className="abrd-column-context">
      <div
        className="column-context-backdrop"
        onMouseDown={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          closeMenu();
        }}
      />
      <div
        ref={menuRef}
        className="column-context-menu"
        style={{ left: menu.x, top: menu.y }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        {!isGrouped ? (
          <ContextMenuItem
            onClick={() => {
              grouping.setPrimaryGroup(column.field, "asc");
              closeMenu();
            }}
          >
            <MenuIcon>
              <LayoutGrid className="h-3.5 w-3.5" />
            </MenuIcon>
            <span>Group by {column.label}</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onClick={() => {
              grouping.clearGrouping();
              closeMenu();
            }}
          >
            <MenuIcon>
              <X className="h-3.5 w-3.5" />
            </MenuIcon>
            <span>Ungroup {column.label}</span>
          </ContextMenuItem>
        )}

        <div className="context-menu-divider" />

        <ContextMenuSubmenuRow
          disabled={!sortable}
          itemRef={activeSubmenu === "sort" ? submenuAnchorRef : undefined}
          onOpen={(event) => sortable && showSubmenu("sort", event)}
          submenu={renderSubmenu(
            "sort",
            <>
              <ContextMenuItem
                active={sortDirection === "asc"}
                onClick={() => {
                  engine.setSort(column.field, "asc");
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <ArrowUp className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Ascending</span>
                <span className="menu-shortcut">Alt+Up</span>
              </ContextMenuItem>
              <ContextMenuItem
                active={sortDirection === "desc"}
                onClick={() => {
                  engine.setSort(column.field, "desc");
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <ArrowDown className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Descending</span>
                <span className="menu-shortcut">Alt+Down</span>
              </ContextMenuItem>
              <div className="context-menu-divider" />
              <ContextMenuItem
                disabled={!sortDirection}
                onClick={() => {
                  if (!sortDirection) return;
                  engine.setSort(column.field, null);
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <X className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Clear Sort</span>
                <span className="menu-shortcut">Alt+0</span>
              </ContextMenuItem>
            </>,
          )}
        >
          <MenuIcon>
            <ArrowUp className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Sort</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <ContextMenuSubmenuRow
          disabled={!filterable}
          itemRef={activeSubmenu === "filter" ? submenuAnchorRef : undefined}
          onOpen={(event) => filterable && showSubmenu("filter", event)}
          submenu={renderSubmenu(
            "filter",
            <>
              <ContextMenuItem
                onClick={() => {
                  filterPanel.openFilterPanel(column.field);
                  closeMenu();
                }}
              >
                <span>Open Filter Panel</span>
                <span className="menu-shortcut">Alt+F</span>
              </ContextMenuItem>
              <div className="context-menu-divider" />
              <ContextMenuItem
                onClick={() => {
                  engine.setColumnFilter(column.field, "isEmpty", true);
                  closeMenu();
                }}
              >
                <span>Is Empty</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  engine.setColumnFilter(column.field, "notEmpty", true);
                  closeMenu();
                }}
              >
                <span>Is Not Empty</span>
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!isNumericColumn(column)}
                onClick={() => {
                  const values = getTopBottomFilterValues(data, column, "top");
                  if (values.length === 0) return;
                  engine.setColumnFilter(column.field, "in", values);
                  closeMenu();
                }}
              >
                <span>Top 10</span>
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!isNumericColumn(column)}
                onClick={() => {
                  const values = getTopBottomFilterValues(data, column, "bottom");
                  if (values.length === 0) return;
                  engine.setColumnFilter(column.field, "in", values);
                  closeMenu();
                }}
              >
                <span>Bottom 10</span>
              </ContextMenuItem>
              <div className="context-menu-divider" />
              <ContextMenuItem
                disabled={!isFiltered}
                onClick={() => {
                  if (!isFiltered) return;
                  engine.clearColumnFilter(column.field);
                  closeMenu();
                }}
              >
                <span>Clear Column Filter</span>
                <span className="menu-shortcut">Alt+X</span>
              </ContextMenuItem>
            </>,
          )}
        >
          <MenuIcon>
            <Filter className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Filter</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <ContextMenuSubmenuRow
          itemRef={activeSubmenu === "pin" ? submenuAnchorRef : undefined}
          onOpen={(event) => showSubmenu("pin", event)}
          submenu={renderSubmenu(
            "pin",
            <>
              {(["left", "right", null] as ColumnPin[]).map((value) => {
                if (value === null) {
                  return (
                    <ContextMenuItem
                      key="unpin"
                      disabled={!pin}
                      onClick={() => {
                        layout.setColumnPin(column.id, null);
                        closeMenu();
                      }}
                    >
                      <MenuIcon>
                        <X className="h-3.5 w-3.5" />
                      </MenuIcon>
                      <span>Unpin</span>
                      <span className="menu-shortcut">Alt+Shift+U</span>
                    </ContextMenuItem>
                  );
                }
                const active = pin === value;
                return (
                  <ContextMenuItem
                    key={value}
                    active={active}
                    disabled={active}
                    onClick={() => {
                      if (active) return;
                      layout.setColumnPin(column.id, value);
                      closeMenu();
                    }}
                  >
                    <MenuIcon>
                      {value === "left" ? (
                        <ArrowLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                    </MenuIcon>
                    <span>{value === "left" ? "Pin Left" : "Pin Right"}</span>
                    <span className="menu-shortcut">
                      {value === "left" ? "Alt+Shift+Left" : "Alt+Shift+Right"}
                    </span>
                  </ContextMenuItem>
                );
              })}
            </>,
          )}
        >
          <MenuIcon>
            <Pin className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Pin</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <ContextMenuSubmenuRow
          itemRef={activeSubmenu === "align" ? submenuAnchorRef : undefined}
          onOpen={(event) => showSubmenu("align", event)}
          submenu={renderSubmenu(
            "align",
            (["left", "center", "right"] as const).map((value) => (
              <ContextMenuItem
                key={value}
                active={align === value}
                onClick={() => {
                  layout.setColumnAlign(column.id, value);
                  closeMenu();
                }}
              >
                <MenuIcon>
                  {value === "left" ? (
                    <AlignLeft className="h-3.5 w-3.5" />
                  ) : value === "center" ? (
                    <AlignCenter className="h-3.5 w-3.5" />
                  ) : (
                    <AlignRight className="h-3.5 w-3.5" />
                  )}
                </MenuIcon>
                <span>{value === "left" ? "Align Left" : value === "center" ? "Align Center" : "Align Right"}</span>
                <span className="menu-shortcut">
                  {value === "left" ? "Alt+L" : value === "center" ? "Alt+C" : "Alt+R"}
                </span>
              </ContextMenuItem>
            )),
          )}
        >
          <MenuIcon>
            <AlignLeft className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Align</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <ContextMenuSubmenuRow
          itemRef={activeSubmenu === "stats" ? submenuAnchorRef : undefined}
          onOpen={(event) => showSubmenu("stats", event)}
          submenu={renderSubmenu(
            "stats",
            <>
              <div className="context-menu-item column-stat column-stats-title">
                <span>Column Stats</span>
              </div>
              <div className="context-menu-item column-stat">
                <span>Non-empty</span>
                <strong>{stats.nonEmpty}</strong>
              </div>
              <div className="context-menu-item column-stat">
                <span>Empty</span>
                <strong>{stats.empty}</strong>
              </div>
              <div className="context-menu-item column-stat">
                <span>Unique</span>
                <strong>{stats.unique}</strong>
              </div>
              <div className="context-menu-item column-stat">
                <span>Min</span>
                <strong>{formatStatValue(stats.min)}</strong>
              </div>
              <div className="context-menu-item column-stat">
                <span>Max</span>
                <strong>{formatStatValue(stats.max)}</strong>
              </div>
              <div className="context-menu-item column-stat">
                <span>Avg</span>
                <strong>{formatStatValue(stats.avg)}</strong>
              </div>
            </>,
            "column-stats-submenu",
          )}
        >
          <MenuIcon>
            <BarChart3 className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Column Stats</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <div className="context-menu-divider" />

        <ContextMenuItem
          onClick={() => {
            layout.setColumnWidth(column.id, estimateColumnWidth(data, column, column.label));
            closeMenu();
          }}
        >
          <MenuIcon>
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Auto-size Column</span>
          <span className="menu-shortcut">Alt+A</span>
        </ContextMenuItem>

        <ContextMenuSubmenuRow
          itemRef={activeSubmenu === "visibility" ? submenuAnchorRef : undefined}
          onOpen={(event) => showSubmenu("visibility", event)}
          className="column-visibility-submenu"
          submenu={renderSubmenu(
            "visibility",
            <>
              <ContextMenuSubmenuRow
                itemRef={activeSubmenu === "choose" ? submenuAnchorRef : undefined}
                onOpen={(event) => showSubmenu("choose", event)}
                submenu={
                  activeSubmenu === "choose" ? (
                    <div
                      ref={chooseSubmenuRef}
                      className={`context-submenu column-context-submenu column-chooser-submenu${submenuPos.openLeft ? " open-left" : ""}${submenuPos.openUp ? " open-up" : ""}`}
                      data-submenu="choose"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <div className="column-chooser-header">
                        <div className="chooser-search-box">
                          <MenuIcon>
                            <Search className="h-3.5 w-3.5" />
                          </MenuIcon>
                          <input
                            className="chooser-search-input"
                            value={columnSearch}
                            onChange={(event) => setColumnSearch(event.target.value)}
                            placeholder="Search columns..."
                            aria-label="Search columns"
                          />
                          {columnSearch ? (
                            <button
                              type="button"
                              className="clear-search"
                              aria-label="Clear search"
                              onClick={() => setColumnSearch("")}
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                        <div className="chooser-info">
                          <span className="selected-count">
                            {visibleCount} / {columns.length}
                          </span>
                        </div>
                      </div>
                      <div className="column-chooser-list">
                        {filteredColumns.length === 0 ? (
                          <div className="context-menu-item menu-empty">
                            <span>No columns found</span>
                          </div>
                        ) : (
                          filteredColumns.map((item) => (
                            <ContextMenuItem
                              key={item.id}
                              className="column-toggle"
                              disabled={!layout.canToggleColumn(item.id) && !layout.hiddenIds.has(item.id)}
                              onClick={() => layout.toggleColumnVisibility(item.id)}
                            >
                              <label className="round-check">
                                <input
                                  type="checkbox"
                                  checked={!layout.hiddenIds.has(item.id)}
                                  readOnly
                                  tabIndex={-1}
                                />
                                <span className="round-check__dot" aria-hidden />
                              </label>
                              <span>{item.label}</span>
                            </ContextMenuItem>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null
                }
              >
                <MenuIcon>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Choose Columns</span>
                <SubmenuArrow />
              </ContextMenuSubmenuRow>
              <div className="context-menu-divider" />
              <ContextMenuItem
                className="caution"
                onClick={() => {
                  layout.showOnlyColumn(column.id);
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <Eye className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Show Only This Column</span>
              </ContextMenuItem>
              <ContextMenuItem
                className="danger"
                onClick={() => {
                  layout.hideColumn(column.id);
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <EyeOff className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Hide Column</span>
              </ContextMenuItem>
              <div className="context-menu-divider" />
              <ContextMenuItem onClick={() => layout.showAllColumns()}>
                <MenuIcon>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Show All Columns</span>
              </ContextMenuItem>
              <ContextMenuItem
                className="danger"
                onClick={() => {
                  layout.hideAllColumns();
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <EyeOff className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Hide All Columns</span>
              </ContextMenuItem>
              <ContextMenuItem
                className="danger"
                onClick={() => {
                  layout.resetColumns();
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Reset Columns</span>
              </ContextMenuItem>
            </>,
            "column-visibility-submenu",
          )}
        >
          <MenuIcon>
            <LayoutGrid className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Columns</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>

        <ContextMenuSubmenuRow
          itemRef={activeSubmenu === "copy" ? submenuAnchorRef : undefined}
          onOpen={(event) => showSubmenu("copy", event)}
          submenu={renderSubmenu(
            "copy",
            <>
              <ContextMenuItem
                onClick={async () => {
                  await copyTextToClipboard(getColumnCopyValues(data, column).join("\n"));
                  closeMenu();
                }}
              >
                <MenuIcon>
                  <Copy className="h-3.5 w-3.5" />
                </MenuIcon>
                <span>Copy Column Values</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={async () => {
                  await copyTextToClipboard(column.label);
                  closeMenu();
                }}
              >
                <span>Copy Column Name</span>
              </ContextMenuItem>
            </>,
          )}
        >
          <MenuIcon>
            <Copy className="h-3.5 w-3.5" />
          </MenuIcon>
          <span>Copy</span>
          <SubmenuArrow />
        </ContextMenuSubmenuRow>
      </div>
    </div>,
    document.body,
  );
}