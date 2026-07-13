"use client";

import { Profiler, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { markRouteTransitionStart } from "@/lib/performance/client";
import { perfStore } from "@/lib/performance/sync-client-store";
import { getTargetMs } from "@/lib/performance/types";

type PerformanceProviderProps = {
  children: React.ReactNode;
};

function onRenderCallback(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
) {
  if (process.env.NODE_ENV !== "development") return;
  perfStore.record({
    category: "render",
    name: id,
    durationMs: Math.round(actualDuration),
    meta: { phase },
  });
}

function WebVitalsCollector() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          perfStore.record({
            category: "web-vital",
            name: "fcp",
            durationMs: Math.round(entry.startTime),
            targetMs: getTargetMs("fcp"),
          });
        }
        if (entry.entryType === "largest-contentful-paint") {
          perfStore.record({
            category: "web-vital",
            name: "lcp",
            durationMs: Math.round(entry.startTime),
            targetMs: getTargetMs("lcp"),
          });
        }
        if (entry.entryType === "longtask") {
          perfStore.record({
            category: "render",
            name: "long-task",
            durationMs: Math.round(entry.duration),
            meta: { attribution: entry.name },
          });
        }
      }
    });

    try {
      observer.observe({ type: "paint", buffered: true });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Some entry types may be unsupported in older browsers
    }

    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navEntry) {
      perfStore.record({
        category: "web-vital",
        name: "tti",
        durationMs: Math.round(navEntry.domInteractive),
        targetMs: getTargetMs("tti"),
      });
    }

    return () => observer.disconnect();
  }, []);

  return null;
}

function RouteTransitionTracker() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const endTransition = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      endTransition.current?.();
      endTransition.current = markRouteTransitionStart(pathname);
      prevPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    endTransition.current?.();
    endTransition.current = markRouteTransitionStart(pathname);
    return () => endTransition.current?.();
  }, []);

  return null;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }

  return (
    <Profiler id="app-root" onRender={onRenderCallback}>
      <WebVitalsCollector />
      <RouteTransitionTracker />
      {children}
    </Profiler>
  );
}
