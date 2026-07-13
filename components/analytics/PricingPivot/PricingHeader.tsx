"use client";

import { RefreshCw } from "lucide-react";

import { usePricingPivotDataContext } from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { cn } from "@/lib/utils";

export function PricingHeader() {
  const { fetchState, reload, rowCount } = usePricingPivotDataContext();

  const loading = fetchState.status === "loading";
  const meta =
    fetchState.status === "success"
      ? `${rowCount.toLocaleString()} measurable lines`
      : null;

  return (
    <header className="pi-header">
      <div className="min-w-0">
        <h1 className="pi-header__title">Pricing Intelligence</h1>
        <p className="pi-header__subtitle">
          Compare unit rates and categories across projects — latest BOQ version per project.
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <button
        type="button"
        className="pi-toolbar__btn"
        onClick={reload}
        disabled={loading}
        aria-label="Refresh data"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        Refresh
      </button>
    </header>
  );
}
