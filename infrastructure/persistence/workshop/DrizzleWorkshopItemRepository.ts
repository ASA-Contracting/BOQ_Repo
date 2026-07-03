import { and, asc, desc, eq, gt, ilike, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";

import {
  aspNetUsers,
  boqWorkAiSuggestion,
  boqWorkImportJob,
  boqWorkItem,
  boqWorkReviewAction,
  families,
} from "@/drizzle/schema";
import { toFamilyId, type FamilyId } from "@/domain/family/ids";
import type { ReviewActionType } from "@/domain/workshop/ReviewActionType";
import type { ReviewStatus } from "@/domain/workshop/ReviewStatus";
import type {
  IWorkshopItemRepository,
  IWorkshopReviewRepository,
  PersistAiSuggestionInput,
  SaveWorkshopClassificationInput,
  CreateWorkshopItemInput,
} from "@/domain/workshop/repositories/IWorkshopItemRepository";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";
import { toWorkshopItemId } from "@/domain/workshop/ids";
import type {
  WorkshopAiSuggestion,
  WorkshopItem,
  WorkshopReviewDecision,
} from "@/domain/workshop/WorkshopItem";
import {
  mapAiSuggestionRowToDomain,
  mapReviewDecisionRowToDomain,
  mapWorkshopItemRowToDomain,
} from "@/infrastructure/persistence/workshop/workshopRowMapper";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

const queueFilter = or(
  eq(boqWorkItem.review_status, "pending"),
  isNull(boqWorkItem.final_family_id),
);

export class DrizzleWorkshopItemRepository
  extends DrizzleRepository
  implements IWorkshopItemRepository
{
  async createWorkshopItems(items: CreateWorkshopItemInput[]): Promise<WorkshopItemId[]> {
    if (items.length === 0) {
      return [];
    }

    const now = new Date();
    const rows = await this.database
      .insert(boqWorkItem)
      .values(
        items.map((item) => ({
          batch_id: item.batchId,
          source_boq_item_id: item.sourceBoqItemId,
          source_boq_id: item.sourceBoqId,
          source_project_id: item.sourceProjectId,
          original_description: item.originalDescription,
          original_unit: item.originalUnit,
          original_item_no: item.originalItemNo,
          original_row_index: item.originalRowIndex,
          original_family_id: item.originalFamilyId ?? null,
          original_is_header: item.originalIsHeader,
          original_is_measurable: item.originalIsMeasurable,
          context_quantity: item.contextQuantity,
          context_boq_version_id: item.contextBoqVersionId ?? null,
          context_snapshot_json: item.contextSnapshotJson,
          imported_at: item.importedAt,
          review_status: "pending",
          created_at: now,
          updated_at: now,
        })),
      )
      .returning({ id: boqWorkItem.id });

    return rows.map((row) => toWorkshopItemId(row.id));
  }

  async skipItem(input: {
    itemId: WorkshopItemId;
    batchId: WorkshopBatchId;
    userId: string;
    reviewedAt: Date;
  }): Promise<void> {
    await this.database
      .update(boqWorkItem)
      .set({
        review_status: "skipped",
        reviewed_by: input.userId,
        reviewed_at: input.reviewedAt,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(boqWorkItem.id, input.itemId),
          eq(boqWorkItem.batch_id, input.batchId),
        ),
      );
  }

  async findById(
    id: WorkshopItemId,
    batchId: WorkshopBatchId,
  ): Promise<WorkshopItem | null> {
    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(and(eq(boqWorkItem.id, id), eq(boqWorkItem.batch_id, batchId)))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopItemRowToDomain(row) : null;
  }

  async findFirstInQueue(batchId: WorkshopBatchId): Promise<WorkshopItem | null> {
    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(and(eq(boqWorkItem.batch_id, batchId), queueFilter))
      .orderBy(asc(boqWorkItem.original_row_index))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopItemRowToDomain(row) : null;
  }

  async findNextInQueue(
    batchId: WorkshopBatchId,
    currentItemId: WorkshopItemId,
  ): Promise<WorkshopItem | null> {
    const current = await this.findById(currentItemId, batchId);
    if (!current) {
      return null;
    }

    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          queueFilter,
          gt(boqWorkItem.original_row_index, current.originalRowIndex),
        ),
      )
      .orderBy(asc(boqWorkItem.original_row_index))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopItemRowToDomain(row) : null;
  }

  async findPreviousInQueue(
    batchId: WorkshopBatchId,
    currentItemId: WorkshopItemId,
  ): Promise<WorkshopItem | null> {
    const current = await this.findById(currentItemId, batchId);
    if (!current) {
      return null;
    }

    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          queueFilter,
          lt(boqWorkItem.original_row_index, current.originalRowIndex),
        ),
      )
      .orderBy(desc(boqWorkItem.original_row_index))
      .limit(1);

    const row = rows[0];
    return row ? mapWorkshopItemRowToDomain(row) : null;
  }

  async listForAiRun(batchId: WorkshopBatchId): Promise<WorkshopItem[]> {
    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          eq(boqWorkItem.original_is_measurable, true),
          eq(boqWorkItem.original_is_header, false),
        ),
      )
      .orderBy(asc(boqWorkItem.original_row_index));

    return rows.map(mapWorkshopItemRowToDomain);
  }

  async countReviewed(batchId: WorkshopBatchId): Promise<number> {
    const rows = await this.database
      .select({ count: sql<number>`count(*)::int` })
      .from(boqWorkItem)
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          eq(boqWorkItem.review_status, "approved"),
        ),
      );

    return rows[0]?.count ?? 0;
  }

  async countTotal(batchId: WorkshopBatchId): Promise<number> {
    const rows = await this.database
      .select({ count: sql<number>`count(*)::int` })
      .from(boqWorkItem)
      .where(eq(boqWorkItem.batch_id, batchId));

    return rows[0]?.count ?? 0;
  }

  async getSuggestionsForItem(itemId: WorkshopItemId): Promise<WorkshopAiSuggestion[]> {
    const rows = await this.database
      .select()
      .from(boqWorkAiSuggestion)
      .where(eq(boqWorkAiSuggestion.workshop_item_id, itemId))
      .orderBy(desc(boqWorkAiSuggestion.run_number));

    return rows.map(mapAiSuggestionRowToDomain);
  }

  async saveClassification(input: SaveWorkshopClassificationInput): Promise<void> {
    await this.database
      .update(boqWorkItem)
      .set({
        final_family_id: input.selectedFamilyId,
        review_status: input.newReviewStatus,
        reviewed_by: input.userId,
        reviewed_at: input.reviewedAt,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(boqWorkItem.id, input.itemId),
          eq(boqWorkItem.batch_id, input.batchId),
        ),
      );
  }

  async persistAiSuggestion(input: PersistAiSuggestionInput): Promise<number> {
    const rows = await this.database
      .insert(boqWorkAiSuggestion)
      .values({
        workshop_item_id: input.workshopItemId,
        ai_analysis_id: input.aiAnalysisId,
        run_number: input.runNumber,
        suggested_family_id: input.suggestedFamilyId,
        confidence: String(input.confidence),
        rationale: input.rationale,
        alternative_family_ids_json: JSON.stringify(input.alternativeFamilyIds),
        model_name: input.modelName,
        prompt_version: input.promptVersion,
        status: "completed",
        created_at: new Date(),
        created_by: input.createdBy,
      })
      .returning({ id: boqWorkAiSuggestion.id });

    return rows[0]?.id ?? 0;
  }

  async updateItemAfterAiSuggestion(
    itemId: WorkshopItemId,
    input: {
      latestSuggestedFamilyId: FamilyId;
      latestAiConfidence: number;
      latestAiSuggestionId: number;
      aiProcessedAt: Date;
    },
  ): Promise<void> {
    await this.database
      .update(boqWorkItem)
      .set({
        latest_suggested_family_id: input.latestSuggestedFamilyId,
        latest_ai_confidence: String(input.latestAiConfidence),
        latest_ai_suggestion_id: input.latestAiSuggestionId,
        ai_processed_at: input.aiProcessedAt,
        updated_at: new Date(),
      })
      .where(eq(boqWorkItem.id, itemId));
  }

  async listSimilarItems(
    batchId: WorkshopBatchId,
    description: string,
    excludeItemId: WorkshopItemId,
    limit: number,
  ): Promise<
    Array<{
      id: WorkshopItemId;
      description: string | null;
      finalFamilyId: FamilyId | null;
      finalFamilyName: string | null;
    }>
  > {
    const trimmed = description.trim().slice(0, 80);
    if (trimmed.length === 0) {
      return [];
    }

    const rows = await this.database
      .select({
        id: boqWorkItem.id,
        description: boqWorkItem.original_description,
        finalFamilyId: boqWorkItem.final_family_id,
        finalFamilyName: families.Name,
      })
      .from(boqWorkItem)
      .leftJoin(families, eq(boqWorkItem.final_family_id, families.Id))
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          ne(boqWorkItem.id, excludeItemId),
          ilike(boqWorkItem.original_description, `%${trimmed.slice(0, 40)}%`),
        ),
      )
      .orderBy(desc(boqWorkItem.reviewed_at))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id as WorkshopItemId,
      description: row.description,
      finalFamilyId: row.finalFamilyId ? toFamilyId(row.finalFamilyId) : null,
      finalFamilyName: row.finalFamilyName,
    }));
  }

  async listApprovedForPublish(batchId: WorkshopBatchId): Promise<WorkshopItem[]> {
    const rows = await this.database
      .select()
      .from(boqWorkItem)
      .where(
        and(
          eq(boqWorkItem.batch_id, batchId),
          eq(boqWorkItem.review_status, "approved"),
          isNotNull(boqWorkItem.final_family_id),
          isNull(boqWorkItem.published_at),
        ),
      )
      .orderBy(asc(boqWorkItem.original_row_index));

    return rows.map(mapWorkshopItemRowToDomain);
  }

  async countPendingReview(batchId: WorkshopBatchId): Promise<number> {
    const rows = await this.database
      .select({ count: sql<number>`count(*)::int` })
      .from(boqWorkItem)
      .where(and(eq(boqWorkItem.batch_id, batchId), queueFilter));

    return rows[0]?.count ?? 0;
  }

  async findFirstInCampaignQueue(
    campaignId: number,
  ): Promise<{ batchId: WorkshopBatchId; itemId: WorkshopItemId } | null> {
    const rows = await this.database
      .select({
        batchId: boqWorkItem.batch_id,
        itemId: boqWorkItem.id,
      })
      .from(boqWorkItem)
      .innerJoin(boqWorkImportJob, eq(boqWorkImportJob.workshop_batch_id, boqWorkItem.batch_id))
      .where(and(eq(boqWorkImportJob.campaign_id, campaignId), queueFilter))
      .orderBy(asc(boqWorkItem.original_row_index))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      batchId: row.batchId as WorkshopBatchId,
      itemId: row.itemId as WorkshopItemId,
    };
  }

  async bulkApproveItems(input: {
    batchId: WorkshopBatchId;
    itemIds: WorkshopItemId[];
    selectedFamilyId: FamilyId;
    userId: string;
    reviewedAt: Date;
  }): Promise<number> {
    if (input.itemIds.length === 0) {
      return 0;
    }

    const result = await this.database
      .update(boqWorkItem)
      .set({
        final_family_id: input.selectedFamilyId,
        review_status: "approved",
        reviewed_by: input.userId,
        reviewed_at: input.reviewedAt,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(boqWorkItem.batch_id, input.batchId),
          or(...input.itemIds.map((id) => eq(boqWorkItem.id, id))),
          or(
            eq(boqWorkItem.review_status, "pending"),
            isNull(boqWorkItem.final_family_id),
          ),
        ),
      )
      .returning({ id: boqWorkItem.id });

    return result.length;
  }
}

export class DrizzleWorkshopReviewRepository
  extends DrizzleRepository
  implements IWorkshopReviewRepository
{
  async insertReviewAction(input: {
    workshopItemId: WorkshopItemId;
    actionType: ReviewActionType;
    previousFamilyId: FamilyId | null;
    selectedFamilyId: FamilyId | null;
    previousReviewStatus: ReviewStatus;
    newReviewStatus: ReviewStatus;
    userId: string;
    createdAt: Date;
  }): Promise<void> {
    await this.database.insert(boqWorkReviewAction).values({
      workshop_item_id: input.workshopItemId,
      action_type: input.actionType,
      previous_family_id: input.previousFamilyId,
      selected_family_id: input.selectedFamilyId,
      previous_review_status: input.previousReviewStatus,
      new_review_status: input.newReviewStatus,
      user_id: input.userId,
      created_at: input.createdAt,
    });
  }

  async listPriorDecisions(
    description: string,
    limit: number,
  ): Promise<WorkshopReviewDecision[]> {
    const trimmed = description.trim().slice(0, 40);
    if (trimmed.length === 0) {
      return [];
    }

    const rows = await this.database
      .select({
        id: boqWorkReviewAction.id,
        workshop_item_id: boqWorkReviewAction.workshop_item_id,
        action_type: boqWorkReviewAction.action_type,
        selected_family_id: boqWorkReviewAction.selected_family_id,
        selected_family_name: families.Name,
        user_display_name: aspNetUsers.FullName,
        created_at: boqWorkReviewAction.created_at,
        item_description: boqWorkItem.original_description,
      })
      .from(boqWorkReviewAction)
      .innerJoin(
        boqWorkItem,
        eq(boqWorkReviewAction.workshop_item_id, boqWorkItem.id),
      )
      .leftJoin(families, eq(boqWorkReviewAction.selected_family_id, families.Id))
      .leftJoin(aspNetUsers, eq(boqWorkReviewAction.user_id, aspNetUsers.Id))
      .where(
        and(
          isNotNull(boqWorkReviewAction.selected_family_id),
          ilike(boqWorkItem.original_description, `%${trimmed}%`),
        ),
      )
      .orderBy(desc(boqWorkReviewAction.created_at))
      .limit(limit);

    return rows.map(mapReviewDecisionRowToDomain);
  }
}
