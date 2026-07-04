"use client";

import { useCallback, useEffect, useRef } from "react";

type UseStretchTabsIndicatorOptions = {
  activeKey: string;
  tabSelector?: string;
};

export function useStretchTabsIndicator({
  activeKey,
  tabSelector = ".boq-settings-tab",
}: UseStretchTabsIndicatorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef({ left: 0, width: 0, visible: false });
  const stretchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStretchTimeout = useCallback(() => {
    if (stretchTimeoutRef.current != null) {
      clearTimeout(stretchTimeoutRef.current);
      stretchTimeoutRef.current = null;
    }
  }, []);

  const applyIndicator = useCallback(
    (left: number, width: number, visible: boolean, transition: string) => {
      const indicator = indicatorRef.current;
      if (!indicator) return;

      stateRef.current = { left, width, visible };
      indicator.style.transition = transition;
      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
      indicator.classList.toggle("is-visible", visible);
    },
    [],
  );

  const measureIndicator = useCallback((item: HTMLElement) => {
    const computedStyle = getComputedStyle(item);
    const insetStart =
      Number.parseFloat(computedStyle.paddingInlineStart || computedStyle.paddingLeft) || 0;
    const insetEnd =
      Number.parseFloat(computedStyle.paddingInlineEnd || computedStyle.paddingRight) || 0;

    return {
      left: item.offsetLeft + insetStart,
      width: Math.max(0, item.offsetWidth - insetStart - insetEnd),
    };
  }, []);

  const syncIndicator = useCallback(
    (animate = false) => {
      const container = containerRef.current;
      const indicator = indicatorRef.current;
      if (!container || !indicator) return;

      const activeItem = container.querySelector<HTMLElement>(`${tabSelector}.active`);
      if (!activeItem) {
        if (stateRef.current.visible) {
          clearStretchTimeout();
          applyIndicator(0, 0, false, "none");
        }
        return;
      }

      const { left, width } = measureIndicator(activeItem);
      const { left: prevLeft, width: prevWidth, visible } = stateRef.current;

      if (visible && prevLeft === left && prevWidth === width) {
        return;
      }

      if (!animate || !visible || prevWidth <= 0) {
        clearStretchTimeout();
        applyIndicator(left, width, true, "none");
        return;
      }

      const currentRight = prevLeft + prevWidth;
      const nextRight = left + width;
      const stretchLeft = Math.min(prevLeft, left);
      const stretchWidth = Math.max(currentRight, nextRight) - stretchLeft;

      clearStretchTimeout();
      applyIndicator(
        stretchLeft,
        stretchWidth,
        true,
        "left 220ms cubic-bezier(0.22, 0.82, 0.36, 1), width 220ms cubic-bezier(0.22, 0.82, 0.36, 1), opacity 160ms ease",
      );

      stretchTimeoutRef.current = setTimeout(() => {
        applyIndicator(
          left,
          width,
          true,
          "left 180ms cubic-bezier(0.4, 0, 0.2, 1), width 180ms cubic-bezier(0.4, 0, 0.2, 1), opacity 160ms ease",
        );
        stretchTimeoutRef.current = null;
      }, 150);
    },
    [applyIndicator, clearStretchTimeout, measureIndicator, tabSelector],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => syncIndicator(true));
    return () => cancelAnimationFrame(frame);
  }, [activeKey, syncIndicator]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onResize = () => syncIndicator(false);
    window.addEventListener("resize", onResize);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncIndicator(false));
      observer.observe(container);
      container.querySelectorAll<HTMLElement>(tabSelector).forEach((item) => observer?.observe(item));
    }

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      clearStretchTimeout();
    };
  }, [clearStretchTimeout, syncIndicator, tabSelector]);

  return { containerRef, indicatorRef };
}
