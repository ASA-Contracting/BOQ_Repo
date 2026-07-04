import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeCloseProject(ctx: RequestContext) {
  return requireAnyRole(ctx, ["general_manager", "system_administrator"]);
}
