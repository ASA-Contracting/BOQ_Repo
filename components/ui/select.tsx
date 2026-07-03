import { ChevronDown } from "lucide-react";
import * as React from "react";

import { controlHeight, inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  inputSize?: keyof typeof controlHeight;
};

export function Select({
  className,
  children,
  inputSize = "md",
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          inputBase,
          controlHeight[inputSize],
          "appearance-none pr-8",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function SelectOption({
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option {...props} />;
}
