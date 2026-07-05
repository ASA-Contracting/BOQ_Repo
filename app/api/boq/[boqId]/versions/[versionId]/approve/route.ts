import { NextRequest } from "next/server";
import { z } from "zod";

import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";

type RouteContext = {
  params: Promise<{ boqId: string; versionId: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { boqId: boqIdParam, versionId: versionIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  const versionId = Number(versionIdParam);

  if (!Number.isFinite(boqId) || boqId <= 0) {
    return apiError("Invalid BOQ id", 400);
  }

  if (!Number.isFinite(versionId) || versionId <= 0) {
    return apiError("Invalid version id", 400);
  }

  const result = await getAppServices().boq.approveBoqVersionFromBreakdownUseCase.execute(ctx, {
    boqId,
    versionId,
  });

  if (!result.ok) {
    const status = result.error.code === "VALIDATION_ERROR" ? 400 : 403;
    return apiError(result.error.message, status);
  }

  return apiSuccess(result.value, "BOQ version approved");
}
