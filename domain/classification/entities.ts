export type LevelTypeEntity = {
  id: number;
  name: string;
  prefix?: string | null;
  suffix?: string | null;
  isNumeric: boolean;
  standardUnitId?: number | null;
  isActive?: boolean;
};

export type LevelOptionEntity = {
  id: number;
  name: string;
  materialLevelTypeId: number | null;
  parentId: number | null;
  schemaId: number;
  value?: number | null;
  unitId?: number | null;
  description?: string | null;
  isActive?: boolean;
};

export type LevelOrderEntity = {
  levelTypeId: number;
  order: number;
  isRequired: boolean;
};

export type ClassificationSchemaEntity = {
  id: number;
  name: string;
  levels: LevelOrderEntity[];
};

export type MaterialItemEntity = {
  id: number;
  materialNodeId: number;
  fullName: string;
  pathIds?: string | null;
};

export type MaterialItemDraft = {
  materialNodeId: number;
  fullName: string;
  pathIds: string;
};

export type CodingRulesEntity = {
  separator: string;
  serialLength: number;
  serialResetScope: 'global' | 'discipline' | 'system' | 'type' | 'spec';
  allowCustomSpec: boolean;
  specRequired: boolean;
};

export type TagEntity = {
  id: number;
  name: string;
  color?: string | null;
};

export type MaterialTagEntity = {
  id: number;
  materialNodeId: number;
  tagId: number;
  tagName?: string;
};

export type MaterialTreeNodeSummaryEntity = {
  materialId: number;
  childrenCount: number;
  descendantCount: number;
  directTagCount: number;
  inheritedTagCount: number;
  materialItemCount: number;
  materialRecordCount: number;
  priceRecordCount: number;
  recordCount: number;
  hasPriceSheet: boolean;
};

export type MaterialSheetSummaryEntity = {
  schemaId: number;
  materialNodeId: number | null;
  recordCount: number;
  updatedAt: string | null;
};
