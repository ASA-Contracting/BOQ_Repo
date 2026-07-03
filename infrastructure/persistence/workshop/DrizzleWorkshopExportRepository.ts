import { eq } from "drizzle-orm";

import {
  auditTrails,
  boqItems,
  boqWorkExportBatch,
  boqWorkExportItem,
  boqWorkItem,
} from "@/drizzle/schema";
import { toBoqItemId } from "@/domain/boq/ids";
import { toFamilyId, type FamilyId } from "@/domain/family/ids";
import type {
  CreateExportBatchInput,
  ExportItemRecordInput,
  IWorkshopExportRepository,
} from "@/domain/workshop/repositories/IWorkshopExportRepository";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleWorkshopExportRepository
  extends DrizzleRepository
  implements IWorkshopExportRepository
{
  async createExportBatch(input: CreateExportBatchInput): Promise<number> {
    const rows = await this.database
      .insert(boqWorkExportBatch)
      .values({
        batch_id: input.batchId,
        status: "running",
        started_at: input.startedAt,
        requested_by: input.requestedBy,
        total_items: input.totalItems,
        publish_policy_snapshot: input.publishPolicySnapshot,
      })
      .returning({ id: boqWorkExportBatch.id });

    const exportBatchId = rows[0]?.id;
    if (!exportBatchId) {
      throw new Error("Failed to create export batch.");
    }

    return exportBatchId;
  }

  async completeExportBatch(input: {
    exportBatchId: number;
    publishedBy: string;
    succeededCount: number;
    failedCount: number;
    skippedCount: number;
    completedAt: Date;
    errorSummary: string | null;
  }): Promise<void> {
    await this.database
      .update(boqWorkExportBatch)
      .set({
        status: input.failedCount > 0 ? "completed_with_errors" : "completed",
        completed_at: input.completedAt,
        published_by: input.publishedBy,
        succeeded_count: input.succeededCount,
        failed_count: input.failedCount,
        skipped_count: input.skippedCount,
        error_summary: input.errorSummary,
      })
      .where(eq(boqWorkExportBatch.id, input.exportBatchId));
  }

  async readProductionFamilyId(
    sourceBoqItemId: import("@/domain/boq/ids").BoqItemId,
  ): Promise<FamilyId | null> {
    const rows = await this.database
      .select({ familyId: boqItems.FamilyId })
      .from(boqItems)
      .where(eq(boqItems.Id, sourceBoqItemId as number))
      .limit(1);

    const familyId = rows[0]?.familyId;
    return familyId ? toFamilyId(familyId) : null;
  }

  async updateProductionFamilyId(
    sourceBoqItemId: import("@/domain/boq/ids").BoqItemId,
    familyId: FamilyId,
    updatedAt: Date,
  ): Promise<void> {
    await this.database
      .update(boqItems)
      .set({
        FamilyId: familyId as number,
        UpdatedAt: updatedAt,
      })
      .where(eq(boqItems.Id, sourceBoqItemId as number));
  }

  async insertAuditTrail(input: {
    userId: string;
    userName: string | null;
    entityId: string;
    oldFamilyId: FamilyId | null;
    newFamilyId: FamilyId;
    timestamp: Date;
  }): Promise<string> {
    const rows = await this.database
      .insert(auditTrails)
      .values({
        UserId: input.userId,
        UserName: input.userName,
        EntityName: "BoqItem",
        EntityId: input.entityId,
        ActionType: "PublishFamilyId",
        Description: "Published FamilyId from Workshop batch",
        OldValues: JSON.stringify({ FamilyId: input.oldFamilyId }),
        NewValues: JSON.stringify({ FamilyId: input.newFamilyId }),
        ChangedColumns: "FamilyId",
        Timestamp: input.timestamp,
      })
      .returning({ id: auditTrails.Id });

    const auditId = rows[0]?.id;
    if (!auditId) {
      throw new Error("Failed to create audit trail for publish.");
    }

    return auditId;
  }

  async insertExportItem(input: ExportItemRecordInput): Promise<number> {
    const rows = await this.database
      .insert(boqWorkExportItem)
      .values({
        export_batch_id: input.exportBatchId,
        workshop_item_id: input.workshopItemId,
        source_boq_item_id: input.sourceBoqItemId as number,
        old_family_id: input.oldFamilyId,
        new_family_id: input.newFamilyId as number,
        status: "succeeded",
        audit_trail_id: input.auditTrailId,
        published_at: input.publishedAt,
        attempt_number: 1,
      })
      .returning({ id: boqWorkExportItem.id });

    const exportItemId = rows[0]?.id;
    if (!exportItemId) {
      throw new Error("Failed to create export item record.");
    }

    return exportItemId;
  }

  async markWorkshopItemPublished(input: {
    workshopItemId: WorkshopItemId;
    batchId: WorkshopBatchId;
    publishedBy: string;
    publishedAt: Date;
    exportItemId: number;
    productionFamilyIdAtCheck: FamilyId;
  }): Promise<void> {
    await this.database
      .update(boqWorkItem)
      .set({
        published_at: input.publishedAt,
        published_by: input.publishedBy,
        last_export_item_id: input.exportItemId,
        production_family_id_at_publish_check: input.productionFamilyIdAtCheck as number,
        updated_at: new Date(),
      })
      .where(
        eq(boqWorkItem.id, input.workshopItemId),
      );
  }
}
