import * as React from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col gap-3 border-b border-border bg-background px-[var(--space-page)] py-4",
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <Heading level="h1">{title}</Heading>
          {description ? (
            <Text variant="muted" size="sm">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {tabs ? <div className="-mb-px">{tabs}</div> : null}
    </header>
  );
}

export function PageContent({
  children,
  className,
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        !flush && "p-[var(--space-page)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspaceLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      {children}
    </div>
  );
}

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
        "flex min-h-0 flex-col border border-border bg-background",
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
