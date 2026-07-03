"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

type FamiliesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FamiliesError({ error, reset }: FamiliesErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Unable to load families"
      description={
        error.message ||
        "An unexpected error occurred while loading the family hierarchy."
      }
      onRetry={reset}
      className="flex-1"
    />
  );
}
