import type { Family, NewFamily } from "@/domain/family/Family";
import type { FamilyReferenceCounts } from "@/domain/family/FamilyReferenceCounts";
import type { FamilyId } from "@/domain/family/ids";

export interface IFamilyRepository {
  findById(id: FamilyId): Promise<Family | null>;
  findAllFlat(): Promise<Family[]>;
  search(query: string, limit: number): Promise<Family[]>;
  findChildren(parentId: FamilyId | null): Promise<Family[]>;
  findSiblingNames(
    parentId: FamilyId | null,
    excludeId?: FamilyId,
  ): Promise<string[]>;
  getAncestorIds(familyId: FamilyId): Promise<FamilyId[]>;
  getReferenceCounts(familyId: FamilyId): Promise<FamilyReferenceCounts>;
  create(family: NewFamily): Promise<Family>;
  update(family: Family): Promise<Family>;
  delete(id: FamilyId): Promise<void>;
}
