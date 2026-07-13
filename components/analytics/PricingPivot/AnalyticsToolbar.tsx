"use client";

import { BookmarkPlus, Flame, LayoutGrid, RotateCcw } from "lucide-react";

import { AggregatorSelector } from "@/components/analytics/PricingPivot/AggregatorSelector";
import { ExportMenu } from "@/components/analytics/PricingPivot/ExportMenu";
import { usePricingPivotWorkspaceContext } from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { cn } from "@/lib/utils";

type AnalyticsToolbarProps = {
  onSaveView: () => void;
};

export function AnalyticsToolbar({ onSaveView }: AnalyticsToolbarProps) {
  const {
    ui,
    setDensity,
    setHeatmapEnabled,
    setShowTotals,
    resetWorkspace,
  } = usePricingPivotWorkspaceContext();

  return (
    <div className="pi-toolbar">
      <AggregatorSelector />

      <button
        type="button"
        className={cn("pi-toolbar__btn", ui.heatmapEnabled && "pi-toolbar__btn--active")}
        onClick={() => setHeatmapEnabled(!ui.heatmapEnabled)}
      >
        <Flame className="h-3 w-3" />
        Heatmap
      </button>

      <button
        type="button"
        className={cn("pi-toolbar__btn", ui.showTotals && "pi-toolbar__btn--active")}
        onClick={() => setShowTotals(!ui.showTotals)}
      >
        <LayoutGrid className="h-3 w-3" />
        Totals
      </button>

      <select
        className="pi-toolbar__select"
        value={ui.density}
        onChange={(event) => setDensity(event.target.value as "compact" | "comfortable")}
        aria-label="Row density"
      >
        <option value="compact">Compact</option>
        <option value="comfortable">Comfortable</option>
      </select>

      <div className="pi-toolbar__spacer" />

      <button type="button" className="pi-toolbar__btn" onClick={onSaveView}>
        <BookmarkPlus className="h-3 w-3" />
        Save
      </button>

      <button type="button" className="pi-toolbar__btn" onClick={resetWorkspace}>
        <RotateCcw className="h-3 w-3" />
        Reset
      </button>

      <ExportMenu />
    </div>
  );
}
