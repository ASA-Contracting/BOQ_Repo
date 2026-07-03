import type { RequestContext } from "@/domain/shared/RequestContext";
import type { Role } from "@/domain/shared/Role";

export function hasRole(ctx: RequestContext, role: Role): boolean {
  return ctx.roles.includes(role);
}

export function hasAnyRole(ctx: RequestContext, roles: readonly Role[]): boolean {
  return roles.some((role) => ctx.roles.includes(role));
}
