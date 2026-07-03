import * as React from "react";

import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-auto [scrollbar-gutter:stable]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
