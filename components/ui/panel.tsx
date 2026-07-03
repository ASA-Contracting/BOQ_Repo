import * as React from "react";

import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex w-full shrink-0 flex-col border border-border bg-background",
        padding && "p-[var(--space-section)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex items-start justify-between gap-3 border-b border-border pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading level="h4">{title}</Heading>
        {description ? (
          <Text variant="muted" size="xs" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function PanelBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

export function PanelFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-3 flex items-center justify-end gap-2 border-t border-border pt-3",
        className,
      )}
      {...props}
    />
  );
}
