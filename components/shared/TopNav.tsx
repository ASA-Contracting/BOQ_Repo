import * as React from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type TopNavProps = {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function TopNav({
  title,
  description,
  breadcrumbs,
  leading,
  actions,
  className,
}: TopNavProps) {
  return (
    <header
      className={cn(
        "flex h-[var(--topnav-height)] shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-[var(--space-page)]",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumbs items={breadcrumbs} className="mb-0.5" />
          ) : null}
          {title ? (
            <Heading level="h4" className="truncate">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <Text variant="muted" size="xs" className="truncate">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[var(--toolbar-height)] shrink-0 items-center gap-2 border-b border-border bg-background px-[var(--space-inline)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>{children}</div>
  );
}

export function ToolbarSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-1 h-4 w-px shrink-0 bg-border", className)}
      aria-hidden
    />
  );
}
