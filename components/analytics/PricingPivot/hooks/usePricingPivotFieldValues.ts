"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PricingPivotFieldValuesQueryDto } from "@/application/dto/reporting/pricingPivotQueryDto";
import type { PricingPivotFieldValuesResponseDto } from "@/application/dto/reporting/pricingPivotResponseDto";
import type { FieldValueOption } from "@/lib/analytics/pivot-engine/field-values";
import { instrumentedFetch } from "@/lib/performance/client";

type FieldValuesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; options: FieldValueOption[] };

export function usePricingPivotFieldValues(query: PricingPivotFieldValuesQueryDto | null) {
  const [state, setState] = useState<FieldValuesState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const queryKey = query ? JSON.stringify(query) : null;

  useEffect(() => {
    if (!query) {
      setState({ status: "idle" });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading" });

    instrumentedFetch("/api/reporting/pricing-pivot/field-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = (await res.json()) as
          | PricingPivotFieldValuesResponseDto
          | { error: string };

        if (!res.ok || "error" in json) {
          setState({ status: "error" });
          return;
        }

        setState({ status: "success", options: json.options });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({ status: "error" });
      });

    return () => {
      controller.abort();
    };
  }, [queryKey, query]);

  const reload = useCallback(() => {
    if (!query) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading" });

    instrumentedFetch("/api/reporting/pricing-pivot/field-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = (await res.json()) as
          | PricingPivotFieldValuesResponseDto
          | { error: string };
        if (!res.ok || "error" in json) {
          setState({ status: "error" });
          return;
        }
        setState({ status: "success", options: json.options });
      })
      .catch(() => setState({ status: "error" }));
  }, [query]);

  return { state, reload };
}
