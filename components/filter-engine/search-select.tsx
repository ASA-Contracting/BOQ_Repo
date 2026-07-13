"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type SearchSelectOption<T> = T;

export type SearchSelectProps<T> = {
  options: T[];
  value: T | null;
  onValueChange: (value: T | null) => void;
  onQueryChange?: (query: string) => void;
  displayFn: (option: T | null) => string;
  isOptionEqual?: (left: T | null, right: T | null) => boolean;
  renderOption?: (option: T, state: { isSelected: boolean }) => React.ReactNode;
  getOptionClassName?: (option: T) => string;
  isPinnedOption?: (option: T) => boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  allowClear?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  overlayPanelClass?: string;
};

type OpenSource = "button" | "inline";

export function SearchSelect<T>({
  options,
  value,
  onValueChange,
  onQueryChange,
  displayFn,
  isOptionEqual,
  renderOption,
  getOptionClassName,
  isPinnedOption,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  noResultsText = "No results",
  allowClear = false,
  disabled = false,
  compact = false,
  className,
  overlayPanelClass = "proj-filter-select-overlay",
}: SearchSelectProps<T>) {
  const instanceId = React.useId().replace(/:/g, "");
  const [open, setOpen] = React.useState(false);
  const [openSource, setOpenSource] = React.useState<OpenSource>("button");
  const [query, setQuery] = React.useState("");
  const originRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const inlineInputRef = React.useRef<HTMLInputElement>(null);
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({});

  const selectedLabel = value ? displayFn(value) : "";

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        isPinnedOption?.(option) || displayFn(option).toLowerCase().includes(term),
    );
  }, [displayFn, isPinnedOption, options, query]);

  const inlineDisplayText =
    open && openSource === "inline" && query.trim().length > 0 ? query : selectedLabel;

  const showPanelSearch = !compact && openSource === "button";

  const updatePanelPosition = React.useCallback(() => {
    const origin = originRef.current;
    if (!origin) return;
    const rect = origin.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, compact ? 92 : 280),
      zIndex: 200010,
    });
  }, [compact]);

  const closePanel = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setOpenSource("button");
  }, []);

  const openListFrom = React.useCallback(
    (source: OpenSource, preserveQuery = false) => {
      if (disabled) return;
      updatePanelPosition();
      setOpenSource(source);
      setOpen(true);
      if (!preserveQuery) {
        setQuery("");
      }
      if (!compact && source === "button") {
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    },
    [compact, disabled, updatePanelPosition],
  );

  React.useEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (originRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closePanel();
    };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [closePanel, open, updatePanelPosition]);

  const selectOption = (option: T) => {
    onValueChange(option);
    closePanel();
  };

  const overlayClassName = [overlayPanelClass, compact ? "proj-filter-select-overlay--compact" : ""]
    .filter(Boolean)
    .join(" ");

  const panel =
    open && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        id={`abrd-ss-panel-${instanceId}`}
        className={overlayClassName}
        style={panelStyle}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`ss-panel hybrid-panel${openSource === "inline" ? " inline-panel" : " button-panel"}${compact ? " compact-panel" : ""}`}
          role="listbox"
        >
          {showPanelSearch ? (
            <input
              ref={searchInputRef}
              className="ss-search"
              type="text"
              autoComplete="off"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closePanel();
                if (event.key === "Enter" && filtered[0]) selectOption(filtered[0]);
              }}
            />
          ) : null}
          <div className="ss-list">
            {filtered.length === 0 ? (
              <div className="ss-empty">{noResultsText}</div>
            ) : (
              filtered.map((option, index) => {
                const label = displayFn(option);
                const isSelected = value != null && (
                  isOptionEqual
                    ? isOptionEqual(value, option)
                    : displayFn(value) === label
                );
                return (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    className={`ss-item${isSelected ? " selected" : ""}${getOptionClassName?.(option) ? ` ${getOptionClassName(option)}` : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectOption(option);
                    }}
                  >
                    {renderOption ? (
                      renderOption(option, { isSelected })
                    ) : (
                      <span className="ss-item-label">{label}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div
      className={`ss inline-enabled open-source${open ? " open" : ""}${disabled ? " disabled" : ""} ${className ?? ""}`.trim()}
    >
      <div ref={originRef} className="ss-origin">
        <div className={`ss-inline-trigger${open ? " focused" : ""}`}>
          <input
            ref={inlineInputRef}
            className="ss-inline-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            placeholder={placeholder}
            value={inlineDisplayText}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              onQueryChange?.(next);
              if (!next.trim()) {
                if (open && openSource === "inline") {
                  closePanel();
                }
                return;
              }
              if (!open || openSource !== "inline") {
                openListFrom("inline", true);
                return;
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && open) {
                closePanel();
                event.preventDefault();
                return;
              }
              if (event.key === "ArrowDown") {
                openListFrom("button");
                event.preventDefault();
                return;
              }
              if (event.key === "Enter" && filtered[0]) {
                selectOption(filtered[0]);
                event.preventDefault();
              }
            }}
          />
          <button
            type="button"
            className="ss-caret-trigger"
            aria-label="Open options"
            aria-expanded={open}
            disabled={disabled}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              if (open && openSource === "button") {
                closePanel();
                return;
              }
              openListFrom("button");
            }}
          >
            <span className="ss-caret-box">
              <span className={`ss-caret${open ? " open" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {panel ? createPortal(panel, document.body) : null}
      {allowClear && value ? (
        <button
          type="button"
          className="ss-clear"
          aria-label="Clear selection"
          onClick={() => onValueChange(null)}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
