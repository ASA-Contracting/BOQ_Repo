import * as React from "react";

import { cn } from "@/lib/utils";

export function Kbd({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export function KeyboardShortcut({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={`${key}-${index}`}>
          {index > 0 ? (
            <span className="text-[10px] text-muted-foreground/60">+</span>
          ) : null}
          <Kbd>{key}</Kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export function ShortcutHint({
  label,
  keys,
  className,
}: {
  label: string;
  keys: string[];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <span>{label}</span>
      <KeyboardShortcut keys={keys} />
    </span>
  );
}
