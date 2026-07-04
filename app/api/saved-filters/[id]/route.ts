import { NextRequest } from "next/server";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return apiError("Invalid saved filter id", 400);
  }

  const result = await getAppServices().preferences.deleteSavedFilterUseCase.execute(ctx, { id });
  if (!result.ok) {
    return apiError(result.error.message, result.error.code === "UNAUTHORIZED" ? 403 : 400);
  }

  return apiSuccess(null, "Saved filter deleted");
}
