import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const result = await getAppServices().workshop.listBoqNotificationsUseCase.execute(ctx, {
    limit: Number.isFinite(limit) ? limit : 20,
  });

  if (!result.ok) {
    return apiError(result.error.message, 403);
  }

  return apiSuccess(result.value, "Notifications retrieved");
}
