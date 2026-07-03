import * as React from "react";

import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type PropertyGridItem = {
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
  fullWidth?: boolean;
};

export type PropertyGridProps = {
  items: PropertyGridItem[];
  columns?: 1 | 2 | 3;
  className?: string;
  labelWidth?: string;
};

export function PropertyGrid({
  items,
  columns = 2,
  className,
  labelWidth = "8rem",
}: PropertyGridProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "grid min-w-0 gap-1",
            item.fullWidth && "sm:col-span-2 lg:col-span-3",
          )}
          style={{ gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }}
        >
          <dt>
            <Text variant="muted" size="xs" weight="medium" as="span">
              {item.label}
            </Text>
          </dt>
          <dd className="min-w-0 text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
