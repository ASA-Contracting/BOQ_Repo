export type UserId = string & { readonly __brand: "UserId" };
export type CorrelationId = string & { readonly __brand: "CorrelationId" };

export function toUserId(value: string): UserId {
  return value as UserId;
}

export function toCorrelationId(value: string): CorrelationId {
  return value as CorrelationId;
}
