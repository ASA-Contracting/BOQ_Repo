import * as React from "react";

import { cn } from "@/lib/utils";

export function TableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex h-[var(--toolbar-height)] shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-[var(--space-inline)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TableToolbarGroup({
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

export function TableToolbarTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </h2>
  );
}

export function TableToolbarSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-1 h-4 w-px shrink-0 bg-border", className)}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export function TableToolbarSpacer() {
  return <div className="flex-1" aria-hidden />;
}
