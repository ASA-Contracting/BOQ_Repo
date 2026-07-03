import { toCorrelationId, type CorrelationId } from "@/domain/shared/ids";

export function createCorrelationId(): CorrelationId {
  return toCorrelationId(globalThis.crypto.randomUUID());
}
