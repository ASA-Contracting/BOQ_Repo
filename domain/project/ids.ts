export type ProjectId = number & { readonly __brand: "ProjectId" };

export function toProjectId(value: number): ProjectId {
  return value as ProjectId;
}
