import {
  requireAnyRole,
  requireRole,
} from "@/domain/shared/authorization/requireRole";
import type { RequestContext } from "@/domain/shared/RequestContext";
import type { Role } from "@/domain/shared/Role";
import type { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import type { Result } from "@/domain/shared/Result";

export class AuthorizationService {
  requireRole(
    ctx: RequestContext,
    role: Role,
  ): Result<void, AuthorizationError> {
    return requireRole(ctx, role);
  }

  requireAnyRole(
    ctx: RequestContext,
    roles: readonly Role[],
  ): Result<void, AuthorizationError> {
    return requireAnyRole(ctx, roles);
  }
}
