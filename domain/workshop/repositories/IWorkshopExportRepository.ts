import type { BoqItemId } from "@/domain/boq/ids";
import type { FamilyId } from "@/domain/family/ids";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";

export type PublishableWorkshopItem = {
  id: WorkshopItemId;
  sourceBoqItemId: BoqItemId;
  finalFamilyId: FamilyId;
};

export type CreateExportBatchInput = {
  batchId: WorkshopBatchId;
  requestedBy: string;
  totalItems: number;
  publishPolicySnapshot: string;
  startedAt: Date;
};

export type ExportItemRecordInput = {
  exportBatchId: number;
  workshopItemId: WorkshopItemId;
  sourceBoqItemId: BoqItemId;
  oldFamilyId: FamilyId | null;
  newFamilyId: FamilyId;
  auditTrailId: string;
  publishedAt: Date;
};

export interface IWorkshopExportRepository {
  createExportBatch(input: CreateExportBatchInput): Promise<number>;
  completeExportBatch(input: {
    exportBatchId: number;
    publishedBy: string;
    succeededCount: number;
    failedCount: number;
    skippedCount: number;
    completedAt: Date;
    errorSummary: string | null;
  }): Promise<void>;
  readProductionFamilyId(sourceBoqItemId: BoqItemId): Promise<FamilyId | null>;
  updateProductionFamilyId(
    sourceBoqItemId: BoqItemId,
    familyId: FamilyId,
    updatedAt: Date,
  ): Promise<void>;
  insertAuditTrail(input: {
    userId: string;
    userName: string | null;
    entityId: string;
    oldFamilyId: FamilyId | null;
    newFamilyId: FamilyId;
    timestamp: Date;
  }): Promise<string>;
  insertExportItem(input: ExportItemRecordInput): Promise<number>;
  markWorkshopItemPublished(input: {
    workshopItemId: WorkshopItemId;
    batchId: WorkshopBatchId;
    publishedBy: string;
    publishedAt: Date;
    exportItemId: number;
    productionFamilyIdAtCheck: FamilyId;
  }): Promise<void>;
}
