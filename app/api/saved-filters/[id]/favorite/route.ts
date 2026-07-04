import { NextRequest } from "next/server";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return apiError("Invalid saved filter id", 400);
  }

  const result = await getAppServices().preferences.setFavoriteSavedFilterUseCase.execute(ctx, { id });
  if (!result.ok) {
    const status =
      result.error.code === "UNAUTHORIZED"
        ? 403
        : result.error.code === "NOT_FOUND"
          ? 404
          : 400;
    return apiError(result.error.message, status);
  }

  return apiSuccess(result.value, "Favorite saved filter updated");
}
