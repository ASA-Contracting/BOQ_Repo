"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
  className?: string;
  fullScreen?: boolean;
};

export function LoadingOverlay({
  visible,
  label = "Loading…",
  className,
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "z-50 flex items-center justify-center bg-background/70 backdrop-blur-[1px]",
        fullScreen ? "fixed inset-0" : "absolute inset-0",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 elevation-2">
        <Spinner label={label} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
    </div>
  );
}

export function LoadingContainer({
  children,
  loading,
  label,
  className,
}: {
  children: React.ReactNode;
  loading: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-0", className)}>
      {children}
      <LoadingOverlay visible={loading} label={label} />
    </div>
  );
}
