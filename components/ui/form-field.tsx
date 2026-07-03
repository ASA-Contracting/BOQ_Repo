import * as React from "react";

import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  id: string;
  label: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
            id,
            "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {description ? (
        <Text id={descriptionId} variant="muted" size="xs" as="p">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text id={errorId} variant="destructive" size="xs" as="p" role="alert">
          {error}
        </Text>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("grid gap-4 border-0 p-0", className)}>
      {title ? (
        <legend className="mb-1 text-sm font-medium text-foreground">
          {title}
        </legend>
      ) : null}
      {description ? (
        <Text variant="muted" size="xs" as="p" className="-mt-2 mb-1">
          {description}
        </Text>
      ) : null}
      {children}
    </fieldset>
  );
}

export function FormActions({
  children,
  className,
  align = "end",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "between";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-2",
        align === "end" && "justify-end",
        align === "start" && "justify-start",
        align === "between" && "justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
