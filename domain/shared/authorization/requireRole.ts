import { hasAnyRole, hasRole } from "@/domain/shared/authorization/hasRole";
import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import type { Role } from "@/domain/shared/Role";
import { err, ok, type Result } from "@/domain/shared/Result";

export function requireRole(
  ctx: RequestContext,
  role: Role,
): Result<void, AuthorizationError> {
  if (!hasRole(ctx, role)) {
    return err(new AuthorizationError());
  }

  return ok(undefined);
}

export function requireAnyRole(
  ctx: RequestContext,
  roles: readonly Role[],
): Result<void, AuthorizationError> {
  if (!hasAnyRole(ctx, roles)) {
    return err(new AuthorizationError());
  }

  return ok(undefined);
}
