import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeSectionHeadApproval(ctx: RequestContext) {
  return requireAnyRole(ctx, [
    "technical_office_manager",
    "general_manager",
    "system_administrator",
  ]);
}
