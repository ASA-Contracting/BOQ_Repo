import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeEngineerSubmit(ctx: RequestContext) {
  return requireAnyRole(ctx, [
    "estimator",
    "reviewer",
    "ai_reviewer",
    "system_administrator",
  ]);
}
