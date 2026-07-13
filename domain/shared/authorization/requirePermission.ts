import {
  getPermissionsForRoles,
  type Permission,
} from "@/domain/shared/Permission";
import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export function requirePermission(
  ctx: RequestContext,
  permission: Permission,
): Result<void, AuthorizationError> {
  if (ctx.userId.length === 0) {
    return err(new AuthorizationError("Authentication is required."));
  }

  const granted = getPermissionsForRoles(ctx.roles);
  if (!granted.includes(permission)) {
    return err(new AuthorizationError());
  }

  return ok(undefined);
}
