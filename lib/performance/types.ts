export type MetricCategory =
  | "web-vital"
  | "route"
  | "dialog"
  | "drawer"
  | "api"
  | "db"
  | "render"
  | "table"
  | "search"
  | "filter"
  | "bundle";

export type PerformanceMetric = {
  id: string;
  category: MetricCategory;
  name: string;
  durationMs: number;
  targetMs?: number;
  timestamp: number;
  meta?: Record<string, string | number | boolean | null>;
};

export type PerformanceTarget = {
  name: string;
  targetMs: number;
};

export const PERFORMANCE_TARGETS: PerformanceTarget[] = [
  { name: "dashboard-page", targetMs: 500 },
  { name: "dialog-open", targetMs: 150 },
  { name: "drawer-open", targetMs: 100 },
  { name: "table-render", targetMs: 300 },
  { name: "route-transition", targetMs: 300 },
  { name: "search", targetMs: 50 },
  { name: "filter", targetMs: 50 },
  { name: "fcp", targetMs: 1800 },
  { name: "lcp", targetMs: 2500 },
  { name: "tti", targetMs: 3800 },
  { name: "api-response", targetMs: 200 },
  { name: "db-query", targetMs: 100 },
];

export function getTargetMs(name: string): number | undefined {
  return PERFORMANCE_TARGETS.find((t) => t.name === name)?.targetMs;
}
