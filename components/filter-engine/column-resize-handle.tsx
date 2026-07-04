"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  onCommit: (widthPx: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
};

export function ColumnResizeHandle({
  onCommit,
  minWidth = 60,
  maxWidth = 960,
  className,
}: Props) {
  const dragRef = React.useRef<{ x: number; width: number; index: number } | null>(null);

  const applyWidth = React.useCallback((th: HTMLTableCellElement, widthPx: number) => {
    const width = `${widthPx}px`;
    th.style.width = width;
    th.style.minWidth = width;
    th.style.maxWidth = width;

    const index = Array.from(th.parentElement?.children ?? []).indexOf(th);
    if (index === -1) return;

    const table = th.closest("table");
    if (!table) return;

    const col = table.querySelectorAll("colgroup col")[index] as HTMLTableColElement | undefined;
    if (col) {
      col.style.width = width;
    }

    table.querySelectorAll("tbody tr.data-row").forEach((row) => {
      const cell = row.children[index] as HTMLTableCellElement | undefined;
      if (!cell) return;
      cell.style.width = width;
      cell.style.minWidth = width;
      cell.style.maxWidth = width;
    });
  }, []);

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const th = event.currentTarget.closest("th");
    if (!th) return;

    const index = Array.from(th.parentElement?.children ?? []).indexOf(th);
    dragRef.current = {
      x: event.clientX,
      width: th.getBoundingClientRect().width,
      index,
    };

    const onMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = moveEvent.clientX - dragRef.current.x;
      const next = Math.min(
        maxWidth,
        Math.max(minWidth, dragRef.current.width + delta),
      );
      applyWidth(th, next);
    };

    const onUp = (upEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = upEvent.clientX - dragRef.current.x;
      const next = Math.min(
        maxWidth,
        Math.max(minWidth, dragRef.current.width + delta),
      );
      onCommit(next);
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      className={cn("abrd-col-resize-handle", className)}
      onMouseDown={onMouseDown}
    />
  );
}
