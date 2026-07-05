import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeWorkshopImport(ctx: RequestContext) {
  return requireAnyRole(ctx, [
    "estimator",
    "general_manager",
    "technical_office_manager",
    "system_administrator",
  ]);
}
