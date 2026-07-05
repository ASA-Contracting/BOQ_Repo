import { requireAnyRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";

export function authorizeWorkshopReview(ctx: RequestContext) {
  return requireAnyRole(ctx, ["estimator", "system_administrator"]);
}
