import { desc, eq, sql } from "drizzle-orm";

import {
  boqWorkAiAnalysis,
  boqWorkBatch,
} from "@/drizzle/schema";
import type { WorkshopBatch } from "@/domain/workshop/WorkshopBatch";
import type { WorkshopBatchStatus } from "@/domain/workshop/WorkshopBatchStatus";
import type { WorkshopWorkflowStage } from "@/domain/workshop/WorkshopWorkflowStage";
import type { WorkshopBatchId } from "@/domain/workshop/ids";
import type {
  CreateWorkshopBatchInput,
  IWorkshopBatchRepository,
  PendingSectionHeadBatchDto,
  SaveClassificationBatchCounterDelta,
} from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import { mapWorkshopBatchRowToDomain } from "@/infrastructure/persistence/workshop/workshopRowMapper";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleWorkshopBatchRepository
  extends DrizzleRepository
  implements IWorkshopBatchRepository
{
  async findById(id: WorkshopBatchId): Promise<WorkshopBatch | null> {
    const rows = await this.database
      .select()
      .from(boqWorkBatch)
      .where(eq(boqWorkBatch.id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopBatchRowToDomain(row) : null;
  }

  async findByName(name: string): Promise<WorkshopBatch | null> {
    const rows = await this.database
      .select()
      .from(boqWorkBatch)
      .where(eq(boqWorkBatch.name, name))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopBatchRowToDomain(row) : null;
  }

  async listRecent(limit: number): Promise<WorkshopBatch[]> {
    const rows = await this.database
      .select()
      .from(boqWorkBatch)
      .orderBy(desc(boqWorkBatch.created_at))
      .limit(limit);

    return rows.map(mapWorkshopBatchRowToDomain);
  }

  async listAwaitingSectionHead(limit = 20): Promise<PendingSectionHeadBatchDto[]> {
    const rows = await this.database
      .select({
        id: boqWorkBatch.id,
        name: boqWorkBatch.name,
        scope_project_id: boqWorkBatch.scope_project_id,
        scope_boq_id: boqWorkBatch.scope_boq_id,
        engineerSubmittedAt: boqWorkBatch.engineerSubmittedAt,
        items_pending_review_count: boqWorkBatch.items_pending_review_count,
      })
      .from(boqWorkBatch)
      .where(eq(boqWorkBatch.workflowStage, "awaiting_section_head"))
      .orderBy(desc(boqWorkBatch.engineerSubmittedAt))
      .limit(limit);

    return rows.map((row) => ({
      batchId: row.id,
      batchName: row.name,
      projectId: row.scope_project_id,
      boqId: row.scope_boq_id,
      engineerSubmittedAt: row.engineerSubmittedAt?.toISOString() ?? null,
      pendingItemCount: row.items_pending_review_count,
    }));
  }

  async createBatch(input: CreateWorkshopBatchInput): Promise<WorkshopBatch> {
    const now = new Date();
    const rows = await this.database
      .insert(boqWorkBatch)
      .values({
        name: input.name,
        description: input.description,
        scope_type: "boq",
        scope_project_id: input.scopeProjectId,
        scope_boq_id: input.scopeBoqId,
        status: "imported",
        workflowStage: "imported",
        linkedBoqVersionId: input.linkedBoqVersionId ?? null,
        import_snapshot_at: now,
        import_item_count: input.importItemCount,
        publish_policy: "partial",
        items_pending_review_count: input.importItemCount,
        items_approved_count: 0,
        items_published_count: 0,
        created_by: input.createdBy,
        created_at: now,
        updated_by: input.createdBy,
        updated_at: now,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create workshop batch.");
    }

    return mapWorkshopBatchRowToDomain(row);
  }

  async updateStatus(id: WorkshopBatchId, status: WorkshopBatchStatus): Promise<void> {
    const workflowStage: WorkshopWorkflowStage | undefined =
      status === "ai_running"
        ? "ai_running"
        : status === "ready_for_review"
          ? "ready_for_engineer_review"
          : status === "completed"
            ? "completed"
            : undefined;

    await this.database
      .update(boqWorkBatch)
      .set({
        status,
        ...(workflowStage ? { workflowStage } : {}),
        updated_at: new Date(),
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async updateWorkflowStage(
    id: WorkshopBatchId,
    workflowStage: WorkshopWorkflowStage,
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        workflowStage,
        updated_at: new Date(),
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async submitEngineerReview(
    id: WorkshopBatchId,
    input: { submittedBy: string; submittedAt: Date },
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        workflowStage: "awaiting_section_head",
        engineerSubmittedAt: input.submittedAt,
        engineerSubmittedBy: input.submittedBy,
        returnToEngineerNotes: null,
        updated_at: input.submittedAt,
        updated_by: input.submittedBy,
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async approveSectionHeadReview(
    id: WorkshopBatchId,
    input: { approvedBy: string; approvedAt: Date },
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        workflowStage: "version_approved",
        status: "ready_for_review",
        sectionHeadApprovedAt: input.approvedAt,
        sectionHeadApprovedBy: input.approvedBy,
        updated_at: input.approvedAt,
        updated_by: input.approvedBy,
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async returnToEngineer(
    id: WorkshopBatchId,
    input: { notes: string | null; returnedAt: Date },
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        workflowStage: "ready_for_engineer_review",
        engineerSubmittedAt: null,
        engineerSubmittedBy: null,
        returnToEngineerNotes: input.notes,
        updated_at: input.returnedAt,
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async updateAfterAiRun(
    id: WorkshopBatchId,
    input: { latestAiAnalysisId: number; status: WorkshopBatchStatus },
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        latest_ai_analysis_id: input.latestAiAnalysisId,
        status: input.status,
        workflowStage: "ready_for_engineer_review",
        updated_at: new Date(),
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async adjustReviewCounters(
    id: WorkshopBatchId,
    delta: SaveClassificationBatchCounterDelta,
  ): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        items_pending_review_count: sql`greatest(0, ${boqWorkBatch.items_pending_review_count} + ${delta.pendingDelta})`,
        items_approved_count: sql`greatest(0, ${boqWorkBatch.items_approved_count} + ${delta.approvedDelta})`,
        updated_at: new Date(),
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async incrementPublishedCount(id: WorkshopBatchId, count: number): Promise<void> {
    await this.database
      .update(boqWorkBatch)
      .set({
        items_published_count: sql`${boqWorkBatch.items_published_count} + ${count}`,
        status: "completed",
        updated_at: new Date(),
      })
      .where(eq(boqWorkBatch.id, id));
  }

  async createAiAnalysis(input: {
    batchId: WorkshopBatchId;
    modelName: string;
    promptVersion: string;
    familyTreeSnapshotJson: string;
    itemCount: number;
    uncategorizedItemCount: number;
    overallConfidence: number | null;
    rawResponseJson: string;
    triggeredBy: string | null;
    startedAt: Date;
    completedAt: Date;
  }): Promise<number> {
    const rows = await this.database
      .insert(boqWorkAiAnalysis)
      .values({
        batch_id: input.batchId,
        status: "completed",
        model_name: input.modelName,
        prompt_version: input.promptVersion,
        family_tree_snapshot_json: input.familyTreeSnapshotJson,
        item_count: input.itemCount,
        uncategorized_item_count: input.uncategorizedItemCount,
        overall_confidence:
          input.overallConfidence !== null
            ? String(input.overallConfidence)
            : null,
        raw_response_json: input.rawResponseJson,
        triggered_by: input.triggeredBy,
        started_at: input.startedAt,
        completed_at: input.completedAt,
        created_at: new Date(),
      })
      .returning({ id: boqWorkAiAnalysis.id });

    return rows[0]?.id ?? 0;
  }
}
