import * as React from "react";

import { controlHeight, inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: keyof typeof controlHeight;
};

export function Input({
  className,
  type,
  inputSize = "md",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      className={cn(inputBase, controlHeight[inputSize], className)}
      {...props}
    />
  );
}
