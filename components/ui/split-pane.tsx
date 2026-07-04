"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type SplitPaneProps = {
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  className?: string;
  /** Allow collapsing the left panel via the divider control. */
  collapsibleLeft?: boolean;
  defaultLeftCollapsed?: boolean;
  leftCollapsed?: boolean;
  onLeftCollapsedChange?: (collapsed: boolean) => void;
  leftCollapsedLabel?: string;
};

export function SplitPane({
  left,
  right,
  defaultLeftPercent = 35,
  minLeftPercent = 24,
  maxLeftPercent = 50,
  className,
  collapsibleLeft = false,
  defaultLeftCollapsed = false,
  leftCollapsed: leftCollapsedProp,
  onLeftCollapsedChange,
  leftCollapsedLabel = "Show master list",
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [leftCollapsedInternal, setLeftCollapsedInternal] = useState(defaultLeftCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const leftCollapsed = leftCollapsedProp ?? leftCollapsedInternal;

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (leftCollapsed) return;

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(
        Math.min(maxLeftPercent, Math.max(minLeftPercent, nextPercent)),
      );
    },
    [leftCollapsed, maxLeftPercent, minLeftPercent],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, isDragging]);

  const setLeftCollapsed = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const resolved =
        typeof next === "function" ? next(leftCollapsedProp ?? leftCollapsedInternal) : next;
      if (leftCollapsedProp === undefined) {
        setLeftCollapsedInternal(resolved);
      }
      onLeftCollapsedChange?.(resolved);
    },
    [leftCollapsedInternal, leftCollapsedProp, onLeftCollapsedChange],
  );

  const toggleLeftCollapsed = () => {
    setLeftCollapsed((current) => !current);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "split-pane flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        leftCollapsed && "split-pane--left-collapsed",
        className,
      )}
    >
      <div
        className={cn(
          "split-pane__left flex min-h-0 min-w-0 flex-col overflow-hidden transition-[width] duration-200 ease-out",
          leftCollapsed && "split-pane__left--collapsed",
        )}
        style={{ width: leftCollapsed ? 0 : `${leftPercent}%` }}
        aria-hidden={leftCollapsed}
      >
        {!leftCollapsed ? left : null}
      </div>

      <div
        className={cn(
          "split-pane__divider relative shrink-0 bg-border",
          leftCollapsed ? "w-9" : "w-px",
          isDragging ? "bg-ring" : "hover:bg-ring/70",
        )}
      >
        {!leftCollapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize"
            onPointerDown={() => setIsDragging(true)}
          />
        ) : null}

        {collapsibleLeft ? (
          <button
            type="button"
            className={cn(
              "split-pane__collapse-btn",
              leftCollapsed && "split-pane__collapse-btn--collapsed",
            )}
            aria-label={leftCollapsed ? leftCollapsedLabel : "Collapse master list panel"}
            aria-expanded={!leftCollapsed}
            onClick={toggleLeftCollapsed}
          >
            {leftCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div className="split-pane__right flex min-h-0 min-w-0 flex-1 flex-col">{right}</div>
    </div>
  );
}
