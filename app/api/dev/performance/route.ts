import { NextResponse } from "next/server";

import { perfStore } from "@/lib/performance/store";
import type { PerformanceMetric } from "@/lib/performance/types";

function devOnly(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function GET() {
  if (!devOnly()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    summary: perfStore.getSummary(),
    metrics: perfStore.getMetrics({ limit: 100 }),
    targets: (await import("@/lib/performance/types")).PERFORMANCE_TARGETS,
  });
}

export async function POST(request: Request) {
  if (!devOnly()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { metrics?: PerformanceMetric[] };
  for (const metric of body.metrics ?? []) {
    perfStore.record(metric);
  }

  return NextResponse.json({ ok: true, count: body.metrics?.length ?? 0 });
}

export async function DELETE() {
  if (!devOnly()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  perfStore.clear();
  return NextResponse.json({ ok: true });
}
