import type { families, familyLevelTypes } from "@/drizzle/schema";
import type { Family, NewFamily } from "@/domain/family/Family";
import type { FamilyLevelType } from "@/domain/family/FamilyLevelType";
import { toFamilyId, toFamilyLevelTypeId } from "@/domain/family/ids";

export type FamiliesRow = typeof families.$inferSelect;
export type FamilyLevelTypesRow = typeof familyLevelTypes.$inferSelect;

export function mapFamilyRowToDomain(row: FamiliesRow): Family {
  return {
    id: toFamilyId(row.Id),
    name: row.Name,
    referenceCode: row.ReferenceCode,
    description: row.Description,
    familyLevelTypeId: toFamilyLevelTypeId(row.FamilyLevelTypeId),
    parentId: row.ParentId === null ? null : toFamilyId(row.ParentId),
  };
}

export function mapFamilyLevelTypeRowToDomain(
  row: FamilyLevelTypesRow,
): FamilyLevelType {
  return {
    id: toFamilyLevelTypeId(row.Id),
    name: row.Name,
  };
}

export function mapNewFamilyToInsertRow(family: NewFamily): typeof families.$inferInsert {
  return {
    Name: family.name,
    ReferenceCode: family.referenceCode,
    Description: family.description,
    FamilyLevelTypeId: family.familyLevelTypeId,
    ParentId: family.parentId,
  };
}

export function mapFamilyToUpdateRow(
  family: Family,
): Omit<typeof families.$inferInsert, "Id"> {
  return {
    Name: family.name,
    ReferenceCode: family.referenceCode,
    Description: family.description,
    FamilyLevelTypeId: family.familyLevelTypeId,
    ParentId: family.parentId,
  };
}
