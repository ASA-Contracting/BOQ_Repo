import * as React from "react";

import { cn } from "@/lib/utils";

type ShellContentProps = {
  children: React.ReactNode;
  className?: string;
  /** Remove padding for full-bleed workspaces (e.g. split panes). */
  flush?: boolean;
};

export function ShellContent({
  children,
  className,
  flush = false,
}: ShellContentProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-background",
        !flush && "p-[var(--space-shell)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ShellPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
