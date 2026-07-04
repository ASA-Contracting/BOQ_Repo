"use client";

import * as React from "react";
import {
  ChevronDown,
  Copy,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type GridSelectionActionBarProps = {
  selectedCount: number;
  undoAvailable: boolean;
  undoLabel?: string;
  statusMessage?: string | null;
  showSelectVisible?: boolean;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  showMoreAction?: boolean;
  showCopyAction?: boolean;
  showExportAction?: boolean;
  editActionLabel?: string;
  deleteActionLabel?: string;
  onClear: () => void;
  onUndo: () => void;
  onDismissUndo: () => void;
  onSelectVisible: () => void;
  onCopy?: () => void;
  onCopyJson?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  onSelectAllLoaded?: () => void;
  onInvertSelection?: () => void;
  className?: string;
};

export function GridSelectionActionBar({
  selectedCount,
  undoAvailable,
  undoLabel = "Previous selection restored",
  statusMessage = null,
  showSelectVisible = true,
  showEditAction = false,
  showDeleteAction = true,
  showMoreAction = true,
  showCopyAction = true,
  showExportAction = false,
  editActionLabel = "Edit Selected",
  deleteActionLabel,
  onClear,
  onUndo,
  onDismissUndo,
  onSelectVisible,
  onCopy,
  onCopyJson,
  onDelete,
  onEdit,
  onInsertAbove,
  onInsertBelow,
  onSelectAllLoaded,
  onInvertSelection,
  className,
}: GridSelectionActionBarProps) {
  const hasSelection = selectedCount > 0;
  const [copyMenuOpen, setCopyMenuOpen] = React.useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  const [localStatus, setLocalStatus] = React.useState<string | null>(null);
  const resolvedDeleteLabel =
    deleteActionLabel ?? (selectedCount > 1 ? "Delete Selected" : "Delete");

  React.useEffect(() => {
    if (!copyMenuOpen && !moreMenuOpen) return;
    const close = () => {
      setCopyMenuOpen(false);
      setMoreMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [copyMenuOpen, moreMenuOpen]);

  React.useEffect(() => {
    if (!statusMessage) return;
    setLocalStatus(statusMessage);
    const timer = window.setTimeout(() => setLocalStatus(null), 2200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const flashStatus = (message: string) => {
    setLocalStatus(message);
    window.setTimeout(() => setLocalStatus(null), 2200);
  };

  if (!hasSelection && !undoAvailable) {
    return null;
  }

  return (
    <div
      className={cn("grid-selection-action-bar-host", className)}
      role="presentation"
    >
      <div className="grid-selection-action-bar" role="toolbar" aria-label="Selected rows actions">
        <div className="grid-selection-action-bar__summary" role="group" aria-label="Selection summary">
          {hasSelection ? (
            <>
              <span className="grid-selection-action-bar__chip">
                <span className="grid-selection-action-bar__chip-count">{selectedCount}</span>
                <span className="grid-selection-action-bar__chip-label">
                  {selectedCount === 1 ? "row selected" : "rows selected"}
                </span>
              </span>
              <button
                type="button"
                className="grid-selection-action-bar__dismiss"
                aria-label="Clear selection"
                title="Clear selection"
                onClick={onClear}
              >
                <X size={13} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <span className="grid-selection-action-bar__chip grid-selection-action-bar__chip--history">
                <span className="grid-selection-action-bar__chip-count">
                  <RotateCcw size={12} aria-hidden />
                </span>
                <span className="grid-selection-action-bar__chip-label">Last selection action</span>
              </span>
              <button
                type="button"
                className="grid-selection-action-bar__dismiss"
                aria-label="Dismiss undo"
                title="Dismiss undo"
                onClick={onDismissUndo}
              >
                <X size={13} aria-hidden />
              </button>
              <span className="grid-selection-action-bar__summary-stat">
                <RotateCcw size={12} aria-hidden />
                <span>{undoLabel}</span>
              </span>
            </>
          )}

          {localStatus ? (
            <span className="grid-selection-action-bar__status" aria-live="polite">
              <span>{localStatus}</span>
            </span>
          ) : null}

          {undoAvailable ? (
            <button
              type="button"
              className="grid-selection-action-bar__action grid-selection-action-bar__action--soft"
              onClick={() => {
                onUndo();
                flashStatus("Selection restored");
              }}
            >
              <RotateCcw size={13} aria-hidden />
              <span>Undo</span>
            </button>
          ) : null}
        </div>

        {hasSelection ? (
          <div className="grid-selection-action-bar__actions" role="group" aria-label="Bulk actions">
            <div
              className="grid-selection-action-bar__action-group grid-selection-action-bar__action-group--utility"
              role="group"
              aria-label="Selection tools"
            >
              {showSelectVisible ? (
                <button
                  type="button"
                  className="grid-selection-action-bar__action grid-selection-action-bar__action--soft"
                  onClick={() => {
                    onSelectVisible();
                    flashStatus("Selection updated");
                  }}
                >
                  <Eye size={13} aria-hidden />
                  <span>Select Visible</span>
                </button>
              ) : null}

              {showCopyAction ? (
                <div className="grid-selection-action-bar__menu">
                  <button
                    type="button"
                    className={cn(
                      "grid-selection-action-bar__action grid-selection-action-bar__action--soft",
                      copyMenuOpen && "grid-selection-action-bar__action--active",
                    )}
                    aria-haspopup="menu"
                    aria-expanded={copyMenuOpen}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCopyMenuOpen((open) => !open);
                      setMoreMenuOpen(false);
                    }}
                  >
                    <Copy size={13} aria-hidden />
                    <span>Copy</span>
                    <ChevronDown size={12} aria-hidden />
                  </button>

                  {copyMenuOpen ? (
                    <div
                      className="grid-selection-action-bar__menu-panel grid-selection-action-bar__menu-panel--compact"
                      role="menu"
                      aria-label="Copy selected rows"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="grid-selection-action-bar__menu-header">
                        <span className="grid-selection-action-bar__menu-section-title">Copy</span>
                        <span className="grid-selection-action-bar__menu-context">
                          {selectedCount} selected
                        </span>
                      </div>
                      <button
                        type="button"
                        className="grid-selection-action-bar__menu-item"
                        role="menuitem"
                        onClick={() => {
                          onCopy?.();
                          setCopyMenuOpen(false);
                          flashStatus("Copied");
                        }}
                      >
                        <Copy size={13} aria-hidden />
                        <span className="grid-selection-action-bar__menu-item-copy">
                          <span className="grid-selection-action-bar__menu-item-label">Copy rows</span>
                          <span className="grid-selection-action-bar__menu-item-detail">
                            Clipboard-friendly table text
                          </span>
                        </span>
                        <span className="grid-selection-action-bar__menu-item-badge">TXT</span>
                      </button>
                      <button
                        type="button"
                        className="grid-selection-action-bar__menu-item"
                        role="menuitem"
                        onClick={() => {
                          onCopyJson?.();
                          setCopyMenuOpen(false);
                          flashStatus("JSON copied");
                        }}
                      >
                        <span className="grid-selection-action-bar__menu-item-icon">{"{}"}</span>
                        <span className="grid-selection-action-bar__menu-item-copy">
                          <span className="grid-selection-action-bar__menu-item-label">Copy as JSON</span>
                          <span className="grid-selection-action-bar__menu-item-detail">
                            Structured data for tools
                          </span>
                        </span>
                        <span className="grid-selection-action-bar__menu-item-badge">JSON</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showExportAction ? (
                <button
                  type="button"
                  className="grid-selection-action-bar__action grid-selection-action-bar__action--soft"
                  disabled
                >
                  <FileText size={13} aria-hidden />
                  <span>Export</span>
                  <ChevronDown size={12} aria-hidden />
                </button>
              ) : null}
            </div>

            {showEditAction || showDeleteAction || showMoreAction ? (
              <div
                className="grid-selection-action-bar__action-group grid-selection-action-bar__action-group--emphasis"
                role="group"
                aria-label="Selected rows management"
              >
                {showEditAction ? (
                  <button
                    type="button"
                    className="grid-selection-action-bar__action grid-selection-action-bar__action--prominent"
                    onClick={onEdit}
                  >
                    <Pencil size={13} aria-hidden />
                    <span>{editActionLabel}</span>
                  </button>
                ) : null}

                {showDeleteAction ? (
                  <button
                    type="button"
                    className="grid-selection-action-bar__action grid-selection-action-bar__action--danger"
                    onClick={onDelete}
                  >
                    <Trash2 size={13} aria-hidden />
                    <span>{resolvedDeleteLabel}</span>
                  </button>
                ) : null}

                {showMoreAction ? (
                  <div className="grid-selection-action-bar__menu">
                    <button
                      type="button"
                      className={cn(
                        "grid-selection-action-bar__action grid-selection-action-bar__action--prominent",
                        moreMenuOpen && "grid-selection-action-bar__action--active",
                      )}
                      aria-haspopup="menu"
                      aria-expanded={moreMenuOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        setMoreMenuOpen((open) => !open);
                        setCopyMenuOpen(false);
                      }}
                    >
                      <MoreHorizontal size={13} aria-hidden />
                      <span>More</span>
                    </button>

                    {moreMenuOpen ? (
                      <div
                        className="grid-selection-action-bar__menu-panel"
                        role="menu"
                        aria-label="More selected rows actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="grid-selection-action-bar__menu-section-title">Actions</div>
                        {onInsertAbove ? (
                          <button
                            type="button"
                            className="grid-selection-action-bar__menu-item"
                            role="menuitem"
                            onClick={() => {
                              onInsertAbove();
                              setMoreMenuOpen(false);
                            }}
                          >
                            <span>Insert row above</span>
                          </button>
                        ) : null}
                        {onInsertBelow ? (
                          <button
                            type="button"
                            className="grid-selection-action-bar__menu-item"
                            role="menuitem"
                            onClick={() => {
                              onInsertBelow();
                              setMoreMenuOpen(false);
                            }}
                          >
                            <span>Insert row below</span>
                          </button>
                        ) : null}
                        {(onInsertAbove || onInsertBelow) ? (
                          <div className="grid-selection-action-bar__menu-divider" aria-hidden />
                        ) : null}
                        {onSelectAllLoaded ? (
                          <button
                            type="button"
                            className="grid-selection-action-bar__menu-item"
                            role="menuitem"
                            onClick={() => {
                              onSelectAllLoaded();
                              setMoreMenuOpen(false);
                              flashStatus("All loaded rows selected");
                            }}
                          >
                            <span>Select All Loaded</span>
                          </button>
                        ) : null}
                        {onInvertSelection ? (
                          <button
                            type="button"
                            className="grid-selection-action-bar__menu-item"
                            role="menuitem"
                            onClick={() => {
                              onInvertSelection();
                              setMoreMenuOpen(false);
                              flashStatus("Selection inverted");
                            }}
                          >
                            <span>Invert Selection</span>
                          </button>
                        ) : null}
                        <div className="grid-selection-action-bar__menu-divider" aria-hidden />
                        <button
                          type="button"
                          className="grid-selection-action-bar__menu-item"
                          role="menuitem"
                          onClick={() => {
                            onClear();
                            setMoreMenuOpen(false);
                          }}
                        >
                          <X size={13} aria-hidden />
                          <span>Clear Selection</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
