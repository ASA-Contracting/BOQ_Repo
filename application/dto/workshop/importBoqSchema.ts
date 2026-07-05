import { z } from "zod";

/** MEP trade disciplines selectable at BOQ import (Master §1 — electromechanical scope). */
export const BOQ_IMPORT_DISCIPLINES = [
  "Electrical",
  "HVAC",
  "Plumbing",
  "Fire Protection",
] as const;

export type BoqImportDiscipline = (typeof BOQ_IMPORT_DISCIPLINES)[number];

export const BOQ_IMPORT_FIELD_KEYS = [
  "description",
  "unit",
  "quantity",
  "unit_price",
  "item_no",
  "section",
  "discipline",
  "family",
  "skip",
] as const;

/** Fields exposed in the BOQ import wizard (fixed order). */
export const BOQ_IMPORT_WIZARD_FIELD_KEYS = [
  "item_no",
  "description",
  "unit",
  "quantity",
  "unit_price",
  "skip",
] as const;

/** Required column mappings before import can proceed. */
export const BOQ_IMPORT_REQUIRED_FIELD_KEYS = [
  "item_no",
  "description",
  "unit",
  "quantity",
  "unit_price",
] as const;

export type BoqImportWizardFieldKey = (typeof BOQ_IMPORT_WIZARD_FIELD_KEYS)[number];

export type BoqImportFieldKey = (typeof BOQ_IMPORT_FIELD_KEYS)[number];

export const columnMappingSchema = z.record(z.string(), z.enum(BOQ_IMPORT_FIELD_KEYS));

export const columnMappingByIndexSchema = z.record(
  z.string().regex(/^\d+$/),
  z.enum(BOQ_IMPORT_FIELD_KEYS),
);

export const importBoqSchema = z.object({
  batchName: z.string().trim().min(1).max(150),
  sheetName: z.string().trim().min(1),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  columnMapping: columnMappingSchema,
  columnMappingByIndex: columnMappingByIndexSchema.optional(),
  headerRowIndex: z.number().int().min(0).optional(),
  skipRowsAfterHeader: z.number().int().min(0).max(10).optional(),
  projectId: z.number().int().positive().optional(),
  boqId: z.number().int().positive().optional(),
  projectName: z.string().trim().min(1).max(150),
  discipline: z.string().trim().min(1).max(150).optional(),
  client: z.string().trim().max(150).optional(),
});

export type ImportBoqInput = z.infer<typeof importBoqSchema>;

export const parseExcelSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1),
  sheetName: z.string().trim().min(1).optional(),
});

export type ParseExcelInput = z.infer<typeof parseExcelSchema>;

export const batchIdSchema = z.object({
  batchId: z.number().int().positive(),
});

export const publishBatchSchema = z.object({
  batchId: z.number().int().positive(),
  publishPolicy: z.enum(["partial", "full"]).optional(),
});

export type PublishBatchInput = z.infer<typeof publishBatchSchema>;

export const bulkApproveSimilarSchema = z.object({
  batchId: z.number().int().positive(),
  sourceItemId: z.number().int().positive(),
  familyId: z.number().int().positive(),
  similarItemIds: z.array(z.number().int().positive()).min(1),
});

export type BulkApproveSimilarInput = z.infer<typeof bulkApproveSimilarSchema>;

export const campaignIdSchema = z.object({
  campaignId: z.number().int().positive(),
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(150),
  defaultColumnMapping: columnMappingSchema.optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const uploadCampaignZipSchema = z.object({
  campaignId: z.number().int().positive(),
  zipBase64: z.string().min(1),
});

export type UploadCampaignZipInput = z.infer<typeof uploadCampaignZipSchema>;

export const processJobsSchema = z.object({
  campaignId: z.number().int().positive(),
  maxJobs: z.number().int().positive().max(10).optional(),
});

export type ProcessJobsInput = z.infer<typeof processJobsSchema>;

export const workshopItemIdSchema = z.object({
  batchId: z.number().int().positive(),
  itemId: z.number().int().positive(),
});

export const saveClassificationSchema = z.object({
  batchId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  familyId: z.number().int().positive(),
});

export type SaveClassificationInput = z.infer<typeof saveClassificationSchema>;

export const returnToEngineerSchema = z.object({
  batchId: z.number().int().positive(),
  notes: z.string().trim().max(2000).optional(),
});

export type ReturnToEngineerInput = z.infer<typeof returnToEngineerSchema>;
