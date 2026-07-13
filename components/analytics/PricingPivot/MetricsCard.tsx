"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricsCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  variant: "projects" | "categories" | "families" | "items" | "avg" | "median";
};

export const MetricsCard = memo(function MetricsCard({
  label,
  value,
  hint,
  icon: Icon,
  variant,
}: MetricsCardProps) {
  return (
    <div className={cn("pi-kpi-card", `pi-kpi-card--${variant}`)}>
      <div className="pi-kpi-card__icon">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="pi-kpi-card__body">
        <div className="pi-kpi-card__label">{label}</div>
        <div className="pi-kpi-card__value">{value}</div>
        {hint ? <div className="pi-kpi-card__hint">{hint}</div> : null}
      </div>
    </div>
  );
});
