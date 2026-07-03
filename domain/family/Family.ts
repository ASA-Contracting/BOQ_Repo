import type { FamilyId, FamilyLevelTypeId } from "@/domain/family/ids";

/**
 * Family aggregate root — maps 1:1 to frozen `Families` columns.
 * Field validation and hierarchy rules: `@/domain/family/familyValidators`.
 */
export type Family = {
  id: FamilyId;
  name: string;
  referenceCode: string | null;
  description: string | null;
  familyLevelTypeId: FamilyLevelTypeId;
  parentId: FamilyId | null;
};

export type NewFamily = Omit<Family, "id">;
