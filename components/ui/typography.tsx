import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { focusRing, interactiveTransition, disabledState } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    level: {
      h1: "text-2xl",
      h2: "text-xl",
      h3: "text-lg",
      h4: "text-base",
    },
  },
  defaultVariants: {
    level: "h2",
  },
});

type HeadingLevel = NonNullable<VariantProps<typeof headingVariants>["level"]>;

const headingElements: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4"> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
};

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

export function Heading({ className, level = "h2", ...props }: HeadingProps) {
  const Component = headingElements[level ?? "h2"];
  return (
    <Component
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
}

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-muted-foreground/80",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      info: "text-info",
      mono: "font-mono text-foreground",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
    weight: "normal",
  },
});

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div";
  };

export function Text({
  className,
  variant,
  size,
  weight,
  as: Component = "p",
  ...props
}: TextProps) {
  return (
    <Component
      className={cn(textVariants({ variant, size, weight }), className)}
      {...props}
    />
  );
}

export function LabelText({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Code({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "rounded-sm bg-muted px-1 py-0.5 font-mono text-xs text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { headingVariants, textVariants };
