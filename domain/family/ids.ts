export type FamilyId = number & { readonly __brand: "FamilyId" };
export type FamilyLevelTypeId = number & { readonly __brand: "FamilyLevelTypeId" };

export function toFamilyId(value: number): FamilyId {
  return value as FamilyId;
}

export function toFamilyLevelTypeId(value: number): FamilyLevelTypeId {
  return value as FamilyLevelTypeId;
}
