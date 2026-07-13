import type { SessionUser } from "@/application/dto/session";
import {
  createRequestContextValue,
  type RequestContext,
} from "@/domain/shared/RequestContext";
import { toUserId, type CorrelationId } from "@/domain/shared/ids";
import { createCorrelationId } from "@/infrastructure/auth/correlationId";

export const DEV_AUTH_USER_ID = "dev-user";
export const DEV_AUTH_EMAIL = "dev@localhost";

export function createSkippedAuthRequestContext(
  correlationId?: CorrelationId,
): RequestContext {
  return createRequestContextValue({
    userId: toUserId(DEV_AUTH_USER_ID),
    roles: ["system_administrator"],
    correlationId: correlationId ?? createCorrelationId(),
    mustChangePassword: false,
  });
}

export function createSkippedAuthSessionUser(): SessionUser {
  return {
    id: DEV_AUTH_USER_ID,
    email: DEV_AUTH_EMAIL,
    displayName: "Dev User",
    roles: ["system_administrator"],
  };
}
