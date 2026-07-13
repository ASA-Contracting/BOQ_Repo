import { NextRequest, NextResponse } from "next/server";

import { pricingPivotQuerySchema } from "@/application/dto/reporting/pricingPivotQueryDto";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { timedApiHandler } from "@/lib/performance/timed";

export async function POST(request: NextRequest) {
  return timedApiHandler("/api/reporting/pricing-pivot", async () => {
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

    const parsed = pricingPivotQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    try {
      const result = await getAppServices().reporting.computePricingPivotUseCase.execute(
        ctx,
        parsed.data,
      );

      if (!result.ok) {
        const status = result.error.code === "AUTHORIZATION_ERROR" ? 403 : 500;
        return NextResponse.json({ error: result.error.message }, { status });
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error("Failed to compute pricing pivot:", error);
      return NextResponse.json(
        {
          error:
            "Failed to compute pricing pivot. The database query timed out or failed.",
        },
        { status: 503 },
      );
    }
  });
}

/** @deprecated Use POST with pivot configuration — returns metadata only. */
export async function GET() {
  return timedApiHandler("/api/reporting/pricing-pivot", async () => {
    const ctx = await resolveRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const dataset =
        await getAppServices().reporting.pricingPivotRepository.listPricingPivotRows();

      return NextResponse.json({ rowCount: dataset.rowCount });
    } catch (error) {
      console.error("Failed to load pricing pivot metadata:", error);
      return NextResponse.json(
        { error: "Failed to load pricing pivot metadata." },
        { status: 503 },
      );
    }
  });
}
