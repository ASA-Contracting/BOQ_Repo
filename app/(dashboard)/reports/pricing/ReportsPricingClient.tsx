"use client";

import dynamic from "next/dynamic";

import { Text } from "@/components/ui/typography";

const PricingPivot = dynamic(
  () =>
    import("@/components/analytics/PricingPivot/PricingPivot").then((m) => ({
      default: m.PricingPivot,
    })),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center p-8">
        <Text variant="muted" size="sm">
          Loading pricing pivot…
        </Text>
      </div>
    ),
    ssr: false,
  },
);

export function ReportsPricingClient() {
  return (
    <div className="h-full min-h-0 -mx-3 -mb-3">
      <PricingPivot />
    </div>
  );
}
