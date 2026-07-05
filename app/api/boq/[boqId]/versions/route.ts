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

  const currentVersionId = Number(request.nextUrl.searchParams.get("versionId") ?? "");
  const result = await getAppServices().boq.listBoqVersionsUseCase.execute(ctx, {
    boqId,
    currentVersionId: Number.isFinite(currentVersionId) && currentVersionId > 0
      ? currentVersionId
      : undefined,
  });

  if (!result.ok) {
    return apiError(result.error.message, 403);
  }

  return apiSuccess(result.value, "BOQ versions retrieved");
}
