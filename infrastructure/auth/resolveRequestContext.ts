import type { SessionUser } from "@/application/dto/session";
import { createRequestContextValue, type RequestContext } from "@/domain/shared/RequestContext";
import { toUserId } from "@/domain/shared/ids";
import {
  createSkippedAuthRequestContext,
  createSkippedAuthSessionUser,
} from "@/infrastructure/auth/devAuth";
import { createAppSupabaseContext } from "@/infrastructure/auth/supabase/context";
import { createCorrelationId } from "@/infrastructure/auth/correlationId";
import { resolveRolesFromClaims } from "@/infrastructure/auth/roles/parseRolesFromClaims";
import { isAuthSkipped } from "@/infrastructure/config/env";
import type { CorrelationId } from "@/domain/shared/ids";

export async function resolveRequestContext(
  correlationId?: CorrelationId,
): Promise<RequestContext | null> {
  if (isAuthSkipped()) {
    return createSkippedAuthRequestContext(correlationId);
  }

  const { data: ctx, error } = await createAppSupabaseContext({ auth: "user" });

  if (error || !ctx.userClaims?.id) {
    return null;
  }

  const roles = resolveRolesFromClaims({
    appMetadata: ctx.userClaims.appMetadata,
    jwtClaims: ctx.jwtClaims as Record<string, unknown> | null | undefined,
  });

  const mustChangePassword =
    ctx.userClaims.userMetadata?.must_change_password === true;

  return createRequestContextValue({
    userId: toUserId(ctx.userClaims.id),
    roles,
    correlationId: correlationId ?? createCorrelationId(),
    mustChangePassword,
  });
}

export async function resolveSessionUser(): Promise<SessionUser | null> {
  if (isAuthSkipped()) {
    return createSkippedAuthSessionUser();
  }

  const { data: ctx, error } = await createAppSupabaseContext({ auth: "user" });

  if (error || !ctx?.userClaims?.email || !ctx.userClaims.id) {
    return null;
  }

  const roles = resolveRolesFromClaims({
    appMetadata: ctx.userClaims.appMetadata,
    jwtClaims: ctx.jwtClaims as Record<string, unknown> | null | undefined,
  });

  const displayName =
    typeof ctx.userClaims.userMetadata?.display_name === "string"
      ? ctx.userClaims.userMetadata.display_name
      : null;

  return {
    id: ctx.userClaims.id,
    email: ctx.userClaims.email,
    displayName,
    roles,
  };
}
