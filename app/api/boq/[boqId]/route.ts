import { NextRequest } from "next/server";

import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { boqId: boqIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  if (!Number.isFinite(boqId) || boqId <= 0) {
    return apiError("Invalid BOQ id", 400);
  }

  const result = await getAppServices().boq.getBoqBreakdownUseCase.execute(ctx, {
    boqId,
    versionId: Number(request.nextUrl.searchParams.get("versionId") ?? "") || undefined,
  });
  if (!result.ok) {
    const status = result.error.code === "VALIDATION_ERROR" ? 404 : 400;
    return apiError(result.error.message, status);
  }

  return apiSuccess(result.value, "BOQ breakdown retrieved");
}
