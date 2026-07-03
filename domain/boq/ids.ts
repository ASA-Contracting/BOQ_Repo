export type ProjectId = number & { readonly __brand: "ProjectId" };
export type BoqId = number & { readonly __brand: "BoqId" };
export type BoqItemId = number & { readonly __brand: "BoqItemId" };
export type BoqVersionId = number & { readonly __brand: "BoqVersionId" };

export function toProjectId(value: number): ProjectId {
  return value as ProjectId;
}

export function toBoqId(value: number): BoqId {
  return value as BoqId;
}

export function toBoqItemId(value: number): BoqItemId {
  return value as BoqItemId;
}

export function toBoqVersionId(value: number): BoqVersionId {
  return value as BoqVersionId;
}
