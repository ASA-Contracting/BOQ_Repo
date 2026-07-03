import { requireRole } from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import { err, ok, type Result } from "@/domain/shared/Result";

export function requireAuthenticatedUser(
  ctx: RequestContext,
): Result<void, AuthorizationError> {
  if (ctx.userId.length === 0) {
    return err(new AuthorizationError("Authentication is required."));
  }

  return ok(undefined);
}

export function authorizeFamilyAdmin(
  ctx: RequestContext,
): Result<void, AuthorizationError> {
  return requireRole(ctx, "system_administrator");
}
