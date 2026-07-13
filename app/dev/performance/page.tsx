"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { PERFORMANCE_TARGETS } from "@/lib/performance/types";

type SummaryRow = {
  category: string;
  name: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  targetMs?: number;
  overTarget: boolean;
};

type MetricRow = {
  id: string;
  category: string;
  name: string;
  durationMs: number;
  targetMs?: number;
  timestamp: number;
  meta?: Record<string, string | number | boolean | null>;
};

type DashboardData = {
  summary: SummaryRow[];
  metrics: MetricRow[];
  targets: Array<{ name: string; targetMs: number }>;
};

function StatusBadge({ overTarget, p95Ms, targetMs }: { overTarget: boolean; p95Ms: number; targetMs?: number }) {
  if (targetMs == null) {
    return <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">—</span>;
  }
  const cls = overTarget
    ? "bg-destructive/15 text-destructive"
    : p95Ms > targetMs * 0.8
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{overTarget ? "OVER" : "OK"}</span>;
}

export default function DevPerformancePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/performance", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    await fetch("/api/dev/performance", { method: "DELETE" });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="min-h-svh bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Performance Dashboard</h1>
            <Text variant="muted" size="sm">
              Development-only instrumentation — FCP, LCP, TTI, routes, dialogs, APIs, DB, renders
            </Text>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => void clear()}>
              Clear
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Targets
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PERFORMANCE_TARGETS.map((t) => (
              <div key={t.name} className="rounded border px-3 py-2 text-sm">
                <div className="font-medium">{t.name}</div>
                <div className="text-muted-foreground">&lt; {t.targetMs} ms</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Summary (p95)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Count</th>
                  <th className="px-4 py-2 font-medium">Avg</th>
                  <th className="px-4 py-2 font-medium">p95</th>
                  <th className="px-4 py-2 font-medium">Max</th>
                  <th className="px-4 py-2 font-medium">Target</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.summary ?? []).map((row) => (
                  <tr key={`${row.category}-${row.name}`} className="border-b last:border-0">
                    <td className="px-4 py-2">{row.category}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.name}</td>
                    <td className="px-4 py-2">{row.count}</td>
                    <td className="px-4 py-2">{row.avgMs} ms</td>
                    <td className="px-4 py-2 font-semibold">{row.p95Ms} ms</td>
                    <td className="px-4 py-2">{row.maxMs} ms</td>
                    <td className="px-4 py-2">{row.targetMs != null ? `${row.targetMs} ms` : "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge overTarget={row.overTarget} p95Ms={row.p95Ms} targetMs={row.targetMs} />
                    </td>
                  </tr>
                ))}
                {!loading && (data?.summary.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No metrics yet. Navigate the app to collect data.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-card overflow-hidden">
          <h2 className="border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent events
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Meta</th>
                </tr>
              </thead>
              <tbody>
                {(data?.metrics ?? []).map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2">{m.category}</td>
                    <td className="px-4 py-2 font-mono text-xs">{m.name}</td>
                    <td className="px-4 py-2">
                      <span className={m.targetMs != null && m.durationMs > m.targetMs ? "text-destructive font-semibold" : ""}>
                        {m.durationMs} ms
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {m.meta ? JSON.stringify(m.meta) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Bundle analysis</p>
          <p className="mt-1">
            Run <code className="rounded bg-muted px-1">npm run analyze</code> to open the Next.js bundle analyzer after production build.
          </p>
        </section>
      </div>
    </div>
  );
}
