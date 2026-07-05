import { z } from 'zod';

import { MAX_CLASSIFICATION_SCHEMA_LEVELS } from '@/domain/classification/constants';

export const levelOrderSchema = z.object({
  levelTypeId: z.number().int().positive(),
  order: z.number().int().positive(),
  isRequired: z.boolean().default(true),
});

export const levelTypeDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  prefix: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),
  isNumeric: z.boolean(),
  standardUnitId: z.number().nullable().optional(),
  isActive: z.boolean(),
});

export const materialNodeDtoSchema = z.object({
  id: z.number(),
  schemaId: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  materialPurpose: z.number(),
  levelTypeId: z.number().nullable(),
  levelTypeName: z.string().nullable().optional(),
  parentId: z.number().nullable(),
  parentName: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  unitId: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const materialItemDtoSchema = z.object({
  id: z.number(),
  materialNodeId: z.number(),
  fullName: z.string(),
  pathIds: z.string().nullable().optional(),
});

export const tagColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e')
  .nullable()
  .optional();

export const tagDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: tagColorSchema,
});

export const materialTagDtoSchema = z.object({
  id: z.number(),
  materialNodeId: z.number(),
  tagId: z.number(),
  tagName: z.string(),
});

export const nodeSummaryDtoSchema = z.object({
  materialId: z.number(),
  childrenCount: z.number(),
  descendantCount: z.number(),
  directTagCount: z.number(),
  inheritedTagCount: z.number(),
  materialItemCount: z.number(),
  materialRecordCount: z.number(),
  priceRecordCount: z.number(),
  recordCount: z.number(),
  hasPriceSheet: z.boolean(),
});

export const sheetSummaryDtoSchema = z.object({
  schemaId: z.number(),
  materialNodeId: z.number().nullable(),
  recordCount: z.number(),
  updatedAt: z.string().nullable(),
});

export const classificationStateDtoSchema = z.object({
  schemaId: z.number().nullable(),
  generatedAt: z.string(),
  levelTypes: z.array(levelTypeDtoSchema),
  materials: z.array(materialNodeDtoSchema),
  materialItems: z.array(materialItemDtoSchema),
  tags: z.array(tagDtoSchema),
  materialTags: z.array(materialTagDtoSchema),
  sheetSummaries: z.array(sheetSummaryDtoSchema),
  nodeSummaries: z.array(nodeSummaryDtoSchema),
});

export const createLevelTypeSchema = z.object({
  name: z.string().min(1).max(150),
  prefix: z.string().max(20).optional(),
  suffix: z.string().max(20).optional(),
  isNumeric: z.boolean().optional(),
  standardUnitId: z.number().nullable().optional(),
});

export const updateLevelTypeSchema = createLevelTypeSchema.extend({
  id: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const saveSchemaHierarchySchema = z.object({
  levels: z.array(levelOrderSchema).min(1).max(MAX_CLASSIFICATION_SCHEMA_LEVELS),
});

export const createMaterialNodeSchema = z.object({
  schemaId: z.number().int().positive(),
  name: z.string().min(1).max(160),
  description: z.string().optional(),
  parentId: z.number().nullable().optional(),
  levelTypeId: z.number().nullable().optional(),
  value: z.string().nullable().optional(),
  unitId: z.number().nullable().optional(),
  purpose: z.number().int().default(1),
});

export const updateMaterialNodeSchema = createMaterialNodeSchema.extend({
  id: z.number().int().positive(),
  isActive: z.boolean(),
});

export const createMaterialItemSchema = z.object({
  materialNodeId: z.number().int().positive(),
  fullName: z.string().min(1),
  pathIds: z.string().optional(),
});

export const updateMaterialItemSchema = createMaterialItemSchema.extend({
  id: z.number().int().positive(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(64),
  color: tagColorSchema,
});

export const updateTagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(64),
  color: tagColorSchema,
});

export const bulkMaterialTagSchema = z.object({
  materialNodeIds: z.array(z.number().int().positive()).min(1),
  tagId: z.number().int().positive(),
});

export const importRowSchema = z.object({
  rowNumber: z.number().optional(),
  path: z.array(z.string().min(1).max(160)).min(1),
  tags: z.array(z.string().min(1).max(64)).default([]),
});

export const importRequestSchema = z.object({
  schemaId: z.number().int().positive().optional(),
  maxDepth: z.number().int().positive().max(MAX_CLASSIFICATION_SCHEMA_LEVELS).optional(),
  rows: z.array(importRowSchema).min(1).max(10000),
});

export const importIssueSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  rowNumber: z.number().optional(),
});

export const importResultSchema = z.object({
  requestedRowCount: z.number(),
  validRowCount: z.number(),
  existingPathCount: z.number(),
  newCategoryCount: z.number(),
  newTagCount: z.number(),
  assignedTagCount: z.number(),
  issues: z.array(importIssueSchema),
  rows: z.array(
    z.object({
      rowNumber: z.number().optional(),
      path: z.array(z.string()),
      tags: z.array(z.string()),
      existingLevelCount: z.number().optional(),
      newLevelCount: z.number().optional(),
      exists: z.boolean().optional(),
    })
  ),
  state: classificationStateDtoSchema.optional(),
});

export type ClassificationStateDto = z.infer<typeof classificationStateDtoSchema>;
export type ImportRequestDto = z.infer<typeof importRequestSchema>;
export type ImportResultDto = z.infer<typeof importResultSchema>;
export type LevelTypeDto = z.infer<typeof levelTypeDtoSchema>;
export type MaterialNodeDto = z.infer<typeof materialNodeDtoSchema>;
