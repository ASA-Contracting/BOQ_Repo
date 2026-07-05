import type { CorrelationId, UserId } from "@/domain/shared/ids";
import type { Role } from "@/domain/shared/Role";

export type RequestContext = {
  userId: UserId;
  roles: Role[];
  correlationId: CorrelationId;
  mustChangePassword: boolean;
};

export function createRequestContextValue(input: {
  userId: UserId;
  roles: Role[];
  correlationId: CorrelationId;
  mustChangePassword?: boolean;
}): RequestContext {
  return {
    userId: input.userId,
    roles: [...input.roles],
    correlationId: input.correlationId,
    mustChangePassword: input.mustChangePassword === true,
  };
}
