export type FamilyLevelTypeDto = {
  id: number;
  name: string;
};

export type FamilyParentSummaryDto = {
  id: number;
  name: string;
};

export type FamilyDetailDto = {
  id: number;
  name: string;
  referenceCode: string | null;
  description: string | null;
  familyLevelTypeId: number;
  familyLevelTypeName: string;
  parentId: number | null;
  parent: FamilyParentSummaryDto | null;
};

export type FamilyListItemDto = {
  id: number;
  name: string;
  referenceCode: string | null;
  description: string | null;
  familyLevelTypeId: number;
  parentId: number | null;
};

export type FamilyTreeNodeDto = {
  id: number;
  name: string;
  referenceCode: string | null;
  familyLevelTypeId: number;
  parentId: number | null;
  children: FamilyTreeNodeDto[];
};
