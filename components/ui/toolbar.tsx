import * as React from "react";

import { cn } from "@/lib/utils";

export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-[var(--toolbar-height)] shrink-0 items-center justify-between gap-3 border-b border-border px-[var(--space-inline)]",
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props} />
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
