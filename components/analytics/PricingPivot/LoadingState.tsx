"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <Skeleton className="h-12 w-full shrink-0 rounded" />
      <Skeleton className="h-14 w-full shrink-0 rounded" />
      <Skeleton className="h-10 w-full shrink-0 rounded" />
      <Skeleton className="min-h-0 flex-1 rounded" />
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <RefreshCw className="h-5 w-5 text-[#2563eb]" />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-medium text-[#0f172a]">Could not load pricing data</p>
        <p className="text-xs text-[#64748b]">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="h-7 gap-1.5 text-xs">
        <RefreshCw className="h-3 w-3" />
        Try again
      </Button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm font-medium text-[#0f172a]">No measurable BOQ lines yet</p>
      <p className="max-w-md text-xs text-[#64748b]">
        Import BOQs and categorize items to populate the pricing intelligence workspace.
      </p>
    </div>
  );
}
