import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeWorkshopPublish(ctx: RequestContext) {
  return requireAnyRole(ctx, [
    "general_manager",
    "technical_office_manager",
    "system_administrator",
  ]);
}
