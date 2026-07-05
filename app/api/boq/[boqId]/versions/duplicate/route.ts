import { NextRequest } from "next/server";
import { z } from "zod";

import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

const duplicateSchema = z.object({
  sourceVersionId: z.number().int().positive(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { boqId: boqIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  if (!Number.isFinite(boqId) || boqId <= 0) {
    return apiError("Invalid BOQ id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = duplicateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  const result = await getAppServices().boq.duplicateBoqVersionUseCase.execute(ctx, {
    boqId,
    sourceVersionId: parsed.data.sourceVersionId,
  });

  if (!result.ok) {
    const status = result.error.code === "VALIDATION_ERROR" ? 400 : 403;
    return apiError(result.error.message, status);
  }

  return apiSuccess(result.value, "BOQ version duplicated");
}
