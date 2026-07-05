import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeBoqVersionApproval(ctx: RequestContext) {
  return requireAnyRole(ctx, [
    "estimator",
    "technical_office_manager",
    "general_manager",
    "system_administrator",
  ]);
}
