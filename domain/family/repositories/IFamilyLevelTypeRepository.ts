import type { FamilyLevelType } from "@/domain/family/FamilyLevelType";
import type { FamilyLevelTypeId } from "@/domain/family/ids";

export interface IFamilyLevelTypeRepository {
  findAll(): Promise<FamilyLevelType[]>;
  findById(id: FamilyLevelTypeId): Promise<FamilyLevelType | null>;
}
