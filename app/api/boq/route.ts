import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";

export async function GET() {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const result = await getAppServices().boq.listBoqsUseCase.execute(ctx);
  if (!result.ok) {
    return apiError(result.error.message, result.error.code === "AUTHORIZATION_ERROR" ? 403 : 400);
  }

  return apiSuccess(result.value, "BOQs retrieved");
}
