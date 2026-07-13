import { NextRequest, NextResponse } from "next/server";

import { pricingPivotFieldValuesQuerySchema } from "@/application/dto/reporting/pricingPivotQueryDto";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { timedApiHandler } from "@/lib/performance/timed";

export async function POST(request: NextRequest) {
  return timedApiHandler("/api/reporting/pricing-pivot/field-values", async () => {
    const ctx = await resolveRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = pricingPivotFieldValuesQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    try {
      const result =
        await getAppServices().reporting.getPricingPivotFieldValuesUseCase.execute(
          ctx,
          parsed.data,
        );

      if (!result.ok) {
        const status = result.error.code === "AUTHORIZATION_ERROR" ? 403 : 500;
        return NextResponse.json({ error: result.error.message }, { status });
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error("Failed to load pricing pivot field values:", error);
      return NextResponse.json(
        { error: "Failed to load field values." },
        { status: 503 },
      );
    }
  });
}
