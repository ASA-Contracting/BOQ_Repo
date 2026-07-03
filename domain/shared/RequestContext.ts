import type { CorrelationId, UserId } from "@/domain/shared/ids";
import type { Role } from "@/domain/shared/Role";

export type RequestContext = {
  userId: UserId;
  roles: Role[];
  correlationId: CorrelationId;
};

export function createRequestContextValue(input: {
  userId: UserId;
  roles: Role[];
  correlationId: CorrelationId;
}): RequestContext {
  return {
    userId: input.userId,
    roles: [...input.roles],
    correlationId: input.correlationId,
  };
}
