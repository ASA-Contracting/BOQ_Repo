import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0 text-xs font-medium",
  {
    variants: {
      status: {
        neutral: "border-border bg-muted text-muted-foreground",
        active: "border-success/20 bg-success/10 text-success",
        pending: "border-warning/30 bg-warning/15 text-warning-foreground",
        error: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-info/20 bg-info/10 text-info",
        offline: "border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

export type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants> & {
    label: string;
    icon?: LucideIcon;
    showDot?: boolean;
  };

const dotColors: Record<
  NonNullable<StatusBadgeProps["status"]>,
  string
> = {
  neutral: "bg-muted-foreground",
  active: "bg-success",
  pending: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  offline: "bg-muted-foreground/50",
};

export function StatusBadge({
  label,
  status = "neutral",
  icon: Icon,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      role="status"
      {...props}
    >
      {showDot ? (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColors[status ?? "neutral"])}
          aria-hidden
        />
      ) : null}
      {Icon ? <Icon className="h-3 w-3 shrink-0" aria-hidden /> : null}
      {label}
    </span>
  );
}

export { statusBadgeVariants };
