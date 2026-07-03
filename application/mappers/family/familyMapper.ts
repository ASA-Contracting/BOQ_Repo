import type {
  FamilyDetailDto,
  FamilyLevelTypeDto,
  FamilyListItemDto,
} from "@/application/dto/family/familyDto";
import type { Family } from "@/domain/family/Family";
import type { FamilyLevelType } from "@/domain/family/FamilyLevelType";

export function mapFamilyLevelTypeToDto(
  levelType: FamilyLevelType,
): FamilyLevelTypeDto {
  return {
    id: levelType.id as number,
    name: levelType.name,
  };
}

export function mapFamilyToListItemDto(family: Family): FamilyListItemDto {
  return {
    id: family.id as number,
    name: family.name,
    referenceCode: family.referenceCode,
    description: family.description,
    familyLevelTypeId: family.familyLevelTypeId as number,
    parentId: family.parentId as number | null,
  };
}

export function mapFamilyToDetailDto(
  family: Family,
  familyLevelTypeName: string,
  parent: Family | null,
): FamilyDetailDto {
  return {
    id: family.id as number,
    name: family.name,
    referenceCode: family.referenceCode,
    description: family.description,
    familyLevelTypeId: family.familyLevelTypeId as number,
    familyLevelTypeName,
    parentId: family.parentId as number | null,
    parent: parent
      ? {
          id: parent.id as number,
          name: parent.name,
        }
      : null,
  };
}
