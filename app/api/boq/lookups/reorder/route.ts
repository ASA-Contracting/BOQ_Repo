import { NextRequest } from "next/server";

import type { ReorderBoqLookupOptionsInput } from "@/application/dto/boq/boqLookupOptionDto";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapUseCaseError(code: string, message: string) {
  if (code === "UNAUTHORIZED") return apiError(message, 403);
  if (code === "NOT_FOUND") return apiError(message, 404);
  return apiError(message, 400);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  let body: ReorderBoqLookupOptionsInput;
  try {
    body = (await request.json()) as ReorderBoqLookupOptionsInput;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await getAppServices().boq.reorderBoqLookupOptionsUseCase.execute(ctx, body);

  if (!result.ok) {
    return mapUseCaseError(result.error.code, result.error.message);
  }

  return apiSuccess(result.value, "BOQ lookup options reordered");
}
