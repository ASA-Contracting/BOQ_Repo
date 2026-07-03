import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "mb-3 flex items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground",
            compact ? "h-8 w-8" : "h-9 w-9",
          )}
        >
          <Icon className={compact ? "h-4 w-4" : "h-4 w-4"} aria-hidden />
        </div>
      ) : null}
      <Heading level="h4" className="mb-0.5">
        {title}
      </Heading>
      {description ? (
        <Text variant="muted" size="sm" className="max-w-sm">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
  action,
  className,
}: Omit<EmptyStateProps, "icon" | "compact">) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[12rem] flex-col items-center justify-center border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      <Text weight="medium" size="sm" className="mb-0.5">
        {title}
      </Text>
      {description ? (
        <Text variant="muted" size="xs" className="max-w-xs">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
