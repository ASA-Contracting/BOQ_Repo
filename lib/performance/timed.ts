import { perfStore } from "@/lib/performance/store";
import { getTargetMs } from "@/lib/performance/types";

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export async function timedDbQuery<T>(
  name: string,
  run: () => Promise<T>,
  meta?: Record<string, string | number | boolean | null>,
): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return run();
  }

  const start = nowMs();
  try {
    return await run();
  } finally {
    perfStore.recordTiming("db", name, start, meta, getTargetMs("db-query"));
  }
}

export async function timedApiHandler<T>(
  route: string,
  run: () => Promise<T>,
): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return run();
  }

  const start = nowMs();
  try {
    return await run();
  } finally {
    perfStore.recordTiming("api", route, start, undefined, getTargetMs("api-response"));
  }
}
