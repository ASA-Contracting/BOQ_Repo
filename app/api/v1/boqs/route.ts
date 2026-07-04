import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { v1Error, v1Success, v1Unauthorized } from "@/infrastructure/http/v1-response";

export async function GET() {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const result = await getAppServices().boq.listBoqsUseCase.execute(ctx);
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value, { total: result.value.length });
}
