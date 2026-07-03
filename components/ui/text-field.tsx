import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { LabelText } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type TextFieldProps = InputProps & {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
};

export function TextField({
  id,
  label,
  description,
  error,
  required,
  className,
  fieldClassName,
  ...props
}: TextFieldProps) {
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
      <Input
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

/** @deprecated Use TextField */
export { TextField as InputField };
