import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      outline: "",
      ghost: "",
      destructive: "",
    },
    size: {
      sm: "icon-sm",
      md: "icon",
      lg: "icon",
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "md",
  },
});

export type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "size" | "children"
> &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
    icon: React.ReactNode;
  };

export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={variant ?? "ghost"}
      size={size === "sm" ? "icon-sm" : "icon"}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {icon}
    </Button>
  );
}

export { iconButtonVariants };
