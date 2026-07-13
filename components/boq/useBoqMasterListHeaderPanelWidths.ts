"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const STORAGE_KEY = "boq-master-list-header-panel-widths-v4";
const RESIZER_COUNT = 3;
export const BML_HEADER_RESIZER_WIDTH = 5;
const MIN_PANEL_WIDTH = 72;

/** Discipline | Projects | BOQs | Progress — aligned stat row default layout */
export const BML_HEADER_DEFAULT_WIDTHS = [164, 204, 252, 288] as const;

function loadStoredWidths(totalContentWidth: number): number[] {
  const defaults = scaleWidths(BML_HEADER_DEFAULT_WIDTHS, totalContentWidth);

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as number[];
    if (
      parsed.length !== BML_HEADER_DEFAULT_WIDTHS.length ||
      parsed.some((value) => !Number.isFinite(value) || value < MIN_PANEL_WIDTH)
    ) {
      return defaults;
    }
    return scaleWidths(parsed, totalContentWidth);
  } catch {
    return defaults;
  }
}

function scaleWidths(widths: readonly number[], totalContentWidth: number): number[] {
  const sum = widths.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    return [...widths];
  }
  const scale = totalContentWidth / sum;
  return widths.map((value) => Math.max(MIN_PANEL_WIDTH, Math.round(value * scale)));
}

function clampPair(left: number, right: number, delta: number): [number, number] {
  let nextLeft = left + delta;
  let nextRight = right - delta;

  if (nextLeft < MIN_PANEL_WIDTH) {
    nextRight -= MIN_PANEL_WIDTH - nextLeft;
    nextLeft = MIN_PANEL_WIDTH;
  }
  if (nextRight < MIN_PANEL_WIDTH) {
    nextLeft -= MIN_PANEL_WIDTH - nextRight;
    nextRight = MIN_PANEL_WIDTH;
  }

  return [nextLeft, nextRight];
}

export function useBoqMasterListHeaderPanelWidths() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<number[] | null>(null);
  const dragRef = useRef<{ index: number; startX: number; startWidths: number[] } | null>(null);

  const measureAndInit = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const totalContentWidth = Math.max(
      container.clientWidth - RESIZER_COUNT * BML_HEADER_RESIZER_WIDTH,
      MIN_PANEL_WIDTH * BML_HEADER_DEFAULT_WIDTHS.length,
    );
    setWidths((current) => current ?? loadStoredWidths(totalContentWidth));
  }, []);

  useLayoutEffect(() => {
    measureAndInit();
  }, [measureAndInit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      setWidths((current) => {
        if (!current) {
          measureAndInit();
          return current;
        }
        const totalContentWidth = Math.max(
          container.clientWidth - RESIZER_COUNT * BML_HEADER_RESIZER_WIDTH,
          MIN_PANEL_WIDTH * BML_HEADER_DEFAULT_WIDTHS.length,
        );
        return scaleWidths(current, totalContentWidth);
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [measureAndInit]);

  useEffect(() => {
    if (!widths || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  const startResize = useCallback(
    (index: number, clientX: number) => {
      if (!widths) return;
      dragRef.current = { index, startX: clientX, startWidths: [...widths] };
    },
    [widths],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const delta = event.clientX - drag.startX;
      setWidths((current) => {
        if (!current) return current;
        const next = [...current];
        const [left, right] = clampPair(
          drag.startWidths[drag.index],
          drag.startWidths[drag.index + 1],
          delta,
        );
        next[drag.index] = left;
        next[drag.index + 1] = right;
        return next;
      });
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return {
    containerRef,
    widths,
    startResize,
    resizerWidth: BML_HEADER_RESIZER_WIDTH,
    defaultWidths: BML_HEADER_DEFAULT_WIDTHS,
  };
}
