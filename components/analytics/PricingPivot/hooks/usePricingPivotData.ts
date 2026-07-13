"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_PIVOT_WORKSPACE } from "@/components/analytics/PricingPivot/constants";
import type { PricingPivotQueryDto } from "@/application/dto/reporting/pricingPivotQueryDto";
import type { PricingPivotResponseDto } from "@/application/dto/reporting/pricingPivotResponseDto";
import { instrumentedFetch } from "@/lib/performance/client";

export type PricingPivotFetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: PricingPivotResponseDto };

const DEBOUNCE_MS = 200;

export function usePricingPivotCompute(query: PricingPivotQueryDto) {
  const [state, setState] = useState<PricingPivotFetchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryKey = JSON.stringify(query);

  const reload = useCallback(
    (nextQuery: PricingPivotQueryDto = query) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: "loading" });

      instrumentedFetch("/api/reporting/pricing-pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextQuery),
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = (await res.json()) as PricingPivotResponseDto | { error: string };

          if (!res.ok || "error" in json) {
            setState({
              status: "error",
              message: "error" in json ? json.error : "Failed to compute pricing pivot.",
            });
            return;
          }

          setState({ status: "success", data: json });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setState({ status: "error", message: "Network error. Try again." });
        });
    },
    [query],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      reload(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, [queryKey, reload, query]);

  return { state, reload: () => reload(query) };
}

export function buildPivotQuery(
  workspace: Omit<PricingPivotQueryDto, "gridSearch">,
  gridSearch: string,
): PricingPivotQueryDto {
  return {
    rows: workspace.rows,
    cols: workspace.cols,
    vals: workspace.vals,
    aggregatorName: workspace.aggregatorName,
    valueFilter: workspace.valueFilter,
    rowOrder: workspace.rowOrder,
    colOrder: workspace.colOrder,
    gridSearch,
  };
}

export const INITIAL_PIVOT_QUERY = buildPivotQuery(DEFAULT_PIVOT_WORKSPACE, "");
