import type { MetricCategory, PerformanceMetric } from "@/lib/performance/types";

const MAX_METRICS = 500;

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

class PerformanceStore {
  private metrics: PerformanceMetric[] = [];

  record(input: Omit<PerformanceMetric, "id" | "timestamp"> & { timestamp?: number }): void {
    if (!isDev()) return;

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
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const durationMs = Math.round(end - startMs);
    this.record({ category, name, durationMs, meta, targetMs });
    return durationMs;
  }

  getMetrics(filter?: { category?: MetricCategory; name?: string; limit?: number }): PerformanceMetric[] {
    let result = [...this.metrics];
    if (filter?.category) {
      result = result.filter((m) => m.category === filter.category);
    }
    if (filter?.name) {
      result = result.filter((m) => m.name === filter.name);
    }
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  getSummary(): Array<{
    category: MetricCategory;
    name: string;
    count: number;
    avgMs: number;
    p95Ms: number;
    maxMs: number;
    targetMs?: number;
    overTarget: boolean;
  }> {
    const groups = new Map<string, number[]>();

    for (const metric of this.metrics) {
      const key = `${metric.category}::${metric.name}`;
      const bucket = groups.get(key) ?? [];
      bucket.push(metric.durationMs);
      groups.set(key, bucket);
    }

    return Array.from(groups.entries())
      .map(([key, durations]) => {
        const [category, name] = key.split("::") as [MetricCategory, string];
        const sorted = [...durations].sort((a, b) => a - b);
        const count = sorted.length;
        const avgMs = Math.round(sorted.reduce((s, v) => s + v, 0) / count);
        const p95Index = Math.min(count - 1, Math.floor(count * 0.95));
        const p95Ms = sorted[p95Index] ?? 0;
        const maxMs = sorted[count - 1] ?? 0;
        const targetMs = this.metrics.find((m) => m.category === category && m.name === name)?.targetMs;
        return {
          category,
          name,
          count,
          avgMs,
          p95Ms,
          maxMs,
          targetMs,
          overTarget: targetMs != null && p95Ms > targetMs,
        };
      })
      .sort((a, b) => b.p95Ms - a.p95Ms);
  }

  clear(): void {
    this.metrics = [];
  }
}

export const perfStore = new PerformanceStore();
