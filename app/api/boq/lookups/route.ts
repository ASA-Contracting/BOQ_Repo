import { NextRequest } from "next/server";

import type { CreateBoqLookupOptionInput } from "@/application/dto/boq/boqLookupOptionDto";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapUseCaseError(code: string, message: string) {
  if (code === "UNAUTHORIZED") return apiError(message, 403);
  if (code === "NOT_FOUND") return apiError(message, 404);
  return apiError(message, 400);
}

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "discipline";

  try {
    const result = await getAppServices().boq.listBoqLookupOptionsUseCase.execute(ctx, {
      category: category as "discipline",
    });

    if (!result.ok) {
      return mapUseCaseError(result.error.code, result.error.message);
    }

    return apiSuccess(result.value, "BOQ lookup options retrieved");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load BOQ lookup options";
    return apiError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  let body: CreateBoqLookupOptionInput;
  try {
    body = (await request.json()) as CreateBoqLookupOptionInput;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await getAppServices().boq.createBoqLookupOptionUseCase.execute(ctx, body);

  if (!result.ok) {
    return mapUseCaseError(result.error.code, result.error.message);
  }

  return apiSuccess(result.value, "BOQ lookup option created");
}
