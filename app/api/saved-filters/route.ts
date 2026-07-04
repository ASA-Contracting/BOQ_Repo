import { NextRequest } from "next/server";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import type { SavedFilterDefinition } from "@/lib/filter-engine";

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const pageKey = request.nextUrl.searchParams.get("pageKey")?.trim() ?? "";
  if (!pageKey) {
    return apiError("pageKey is required", 400);
  }

  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const result = await getAppServices().preferences.listSavedFiltersUseCase.execute(ctx, { pageKey });
  if (!result.ok) {
    return apiError(result.error.message, result.error.code === "UNAUTHORIZED" ? 403 : 400);
  }

  return apiSuccess(result.value, "Saved filters retrieved");
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  let body: {
    pageKey?: string;
    name?: string;
    definition?: SavedFilterDefinition;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const saveResult = await getAppServices().preferences.upsertSavedFilterUseCase.execute(ctx, {
    pageKey: body.pageKey ?? "",
    name: body.name ?? "",
    definition: body.definition ?? { groups: [] },
  });

  if (!saveResult.ok) {
    return apiError(saveResult.error.message, saveResult.error.code === "UNAUTHORIZED" ? 403 : 400);
  }

  return apiSuccess(saveResult.value, "Saved filter stored");
}
