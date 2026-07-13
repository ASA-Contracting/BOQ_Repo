"use client";

import { perfStore } from "@/lib/performance/sync-client-store";
import { getTargetMs } from "@/lib/performance/types";

export function markRouteTransitionStart(path: string): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming("route", "route-transition", start, { path }, getTargetMs("route-transition"));
  };
}

export function markDialogOpen(name: string): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming("dialog", "dialog-open", start, { name }, getTargetMs("dialog-open"));
  };
}

export function markDrawerOpen(name: string): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming("drawer", "drawer-open", start, { name }, getTargetMs("drawer-open"));
  };
}

export function markTableRender(name: string, rowCount: number): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming(
      "table",
      "table-render",
      start,
      { name, rowCount },
      getTargetMs("table-render"),
    );
  };
}

export function markSearch(name: string): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming("search", "search", start, { name }, getTargetMs("search"));
  };
}

export function markFilter(name: string): () => void {
  const start = performance.now();
  return () => {
    perfStore.recordTiming("filter", "filter", start, { name }, getTargetMs("filter"));
  };
}

export async function instrumentedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const start = performance.now();

  try {
    const response = await fetch(input, init);
    perfStore.recordTiming(
      "api",
      "api-response",
      start,
      { url, status: response.status },
      getTargetMs("api-response"),
    );
    return response;
  } catch (error) {
    perfStore.recordTiming("api", "api-response", start, { url, status: 0 });
    throw error;
  }
}
