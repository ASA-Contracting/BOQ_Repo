import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Try again or contact support if the problem persists.",
  icon: Icon = AlertCircle,
  action,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <Heading level="h4" className="mb-1">
        {title}
      </Heading>
      <Text variant="muted" size="sm" className="max-w-md">
        {description}
      </Text>
      {action ?? (onRetry ? (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null)}
    </div>
  );
}

export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs text-destructive",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
