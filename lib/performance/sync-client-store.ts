"use client";

import type { MetricCategory, PerformanceMetric } from "@/lib/performance/types";

const MAX_METRICS = 500;
const FLUSH_INTERVAL_MS = 2000;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

class ClientPerformanceStore {
  private metrics: PerformanceMetric[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  record(input: Omit<PerformanceMetric, "id" | "timestamp"> & { timestamp?: number }): void {
    const metric: PerformanceMetric = {
      id: createId(),
      timestamp: input.timestamp ?? Date.now(),
      ...input,
    };
    this.metrics.unshift(metric);
    if (this.metrics.length > MAX_METRICS) {
      this.metrics.length = MAX_METRICS;
    }
  }

  recordTiming(
    category: MetricCategory,
    name: string,
    startMs: number,
    meta?: PerformanceMetric["meta"],
    targetMs?: number,
  ): number {
    const durationMs = Math.round(performance.now() - startMs);
    this.record({ category, name, durationMs, meta, targetMs });
    return durationMs;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;
    const batch = [...this.metrics];
    try {
      await fetch("/api/dev/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: batch }),
        keepalive: true,
      });
    } catch {
      // Dev-only; ignore network errors during flush
    }
  }
}

export const perfStore = new ClientPerformanceStore();
