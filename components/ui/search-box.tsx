"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { controlHeight, inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

export type SearchBoxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  onClear?: () => void;
  inputSize?: keyof typeof controlHeight;
  containerClassName?: string;
};

export function SearchBox({
  className,
  containerClassName,
  value,
  onClear,
  inputSize = "md",
  ...props
}: SearchBoxProps) {
  const showClear = typeof value === "string" && value.length > 0;

  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        role="searchbox"
        value={value}
        className={cn(inputBase, controlHeight[inputSize], "pl-8 pr-8", className)}
        {...props}
      />
      {showClear && onClear ? (
        <button
          type="button"
          aria-label="Clear search"
          className="focus-ring absolute top-1/2 right-1.5 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** @deprecated Use SearchBox */
export { SearchBox as SearchInput };
