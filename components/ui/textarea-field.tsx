import * as React from "react";

import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { LabelText } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type TextareaFieldProps = TextareaProps & {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
};

export function TextareaField({
  id,
  label,
  description,
  error,
  required,
  className,
  fieldClassName,
  ...props
}: TextareaFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("grid gap-1.5", fieldClassName)}>
      {label ? (
        <LabelText htmlFor={fieldId}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </LabelText>
      ) : null}
      <Textarea
        id={fieldId}
        className={className}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        aria-required={required}
        required={required}
        {...props}
      />
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
