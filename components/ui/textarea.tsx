import * as React from "react";

import { inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(inputBase, "min-h-[5rem] resize-y py-2", className)}
      {...props}
    />
  );
}
