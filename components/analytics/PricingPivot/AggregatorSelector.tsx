"use client";

import { PIVOT_AGGREGATOR_OPTIONS } from "@/components/analytics/PricingPivot/constants";
import { usePricingPivotWorkspaceContext } from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import type { PivotAggregatorId } from "@/lib/analytics/pivot-engine/types";

export function AggregatorSelector() {
  const { workspace, setAggregator } = usePricingPivotWorkspaceContext();

  return (
    <select
      className="pi-toolbar__select"
      value={workspace.aggregatorName}
      onChange={(event) => setAggregator(event.target.value as PivotAggregatorId)}
      aria-label="Aggregation"
    >
      {PIVOT_AGGREGATOR_OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
