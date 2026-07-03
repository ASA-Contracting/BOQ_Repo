import type { FamilyLevelTypeId } from "@/domain/family/ids";

/** Read-only reference entity — maps 1:1 to frozen `FamilyLevelTypes` columns. */
export type FamilyLevelType = {
  id: FamilyLevelTypeId;
  name: string;
};
