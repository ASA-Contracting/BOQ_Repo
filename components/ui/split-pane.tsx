"use client";

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
};

export function SplitPane({
  left,
  right,
  defaultLeftPercent = 35,
  minLeftPercent = 24,
  maxLeftPercent = 50,
  className,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
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
    [maxLeftPercent, minLeftPercent],
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

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm", className)}
    >
      <div
        className="flex min-h-0 min-w-0 flex-col"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        className={cn(
          "relative w-px shrink-0 bg-border",
          isDragging ? "bg-ring" : "hover:bg-ring/70",
        )}
        onPointerDown={() => setIsDragging(true)}
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{right}</div>
    </div>
  );
}
