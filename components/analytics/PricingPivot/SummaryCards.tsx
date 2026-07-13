"use client";

import { useMemo } from "react";
import {
  DollarSign,
  FolderKanban,
  FolderTree,
  Hash,
  Layers,
  TrendingUp,
} from "lucide-react";

import { MetricsCard } from "@/components/analytics/PricingPivot/MetricsCard";
import { usePricingPivotDataContext } from "@/components/analytics/PricingPivot/context/PricingPivotContext";

function formatRate(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SummaryCards() {
  const { summary } = usePricingPivotDataContext();

  const cards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Projects",
        value: summary.projectCount.toLocaleString(),
        icon: FolderKanban,
        variant: "projects" as const,
      },
      {
        label: "Categories",
        value: summary.categoryCount.toLocaleString(),
        icon: FolderTree,
        variant: "categories" as const,
      },
      {
        label: "Families",
        value: summary.familyCount.toLocaleString(),
        icon: Layers,
        variant: "families" as const,
      },
      {
        label: "Items",
        value: summary.itemCount.toLocaleString(),
        hint: `${summary.pricedItemCount.toLocaleString()} priced`,
        icon: Hash,
        variant: "items" as const,
      },
      {
        label: "Avg Rate",
        value: formatRate(summary.averageRate),
        hint: "Unit rate average",
        icon: TrendingUp,
        variant: "avg" as const,
      },
      {
        label: "Median",
        value: formatRate(summary.medianRate),
        hint: "Unit rate median",
        icon: DollarSign,
        variant: "median" as const,
      },
    ];
  }, [summary]);

  if (!summary) return null;

  return (
    <div className="pi-kpi-strip">
      {cards.map((card) => (
        <MetricsCard
          key={card.label}
          label={card.label}
          value={card.value}
          hint={card.hint}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </div>
  );
}
