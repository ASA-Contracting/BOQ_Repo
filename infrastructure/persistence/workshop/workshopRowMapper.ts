import type { WorkshopBatch } from "@/domain/workshop/WorkshopBatch";
import { isWorkshopBatchStatus } from "@/domain/workshop/WorkshopBatchStatus";
import { isWorkshopWorkflowStage } from "@/domain/workshop/WorkshopWorkflowStage";
import type {
  WorkshopAiSuggestion,
  WorkshopItem,
  WorkshopReviewDecision,
} from "@/domain/workshop/WorkshopItem";
import { isReviewStatus } from "@/domain/workshop/ReviewStatus";
import { toFamilyId } from "@/domain/family/ids";
import {
  toWorkshopBatchId,
  toWorkshopItemId,
} from "@/domain/workshop/ids";

type WorkshopBatchRow = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  workflowStage: string;
  import_item_count: number;
  items_pending_review_count: number;
  items_approved_count: number;
  items_published_count: number;
  latest_ai_analysis_id: number | null;
  scope_project_id: number | null;
  scope_boq_id: number | null;
  linkedBoqVersionId: number | null;
  engineerSubmittedAt: Date | null;
  engineerSubmittedBy: string | null;
  sectionHeadApprovedAt: Date | null;
  sectionHeadApprovedBy: string | null;
  returnToEngineerNotes: string | null;
};

type WorkshopItemRow = {
  id: number;
  batch_id: number;
  source_boq_item_id: number;
  original_description: string | null;
  original_unit: string | null;
  original_item_no: string | null;
  original_row_index: number;
  original_family_id: number | null;
  context_quantity: string | null;
  context_snapshot_json: string | null;
  latest_suggested_family_id: number | null;
  latest_ai_confidence: string | null;
  latest_ai_suggestion_id: number | null;
  final_family_id: number | null;
  review_status: string;
  ai_processed_at: Date | null;
};

type AiSuggestionRow = {
  id: number;
  workshop_item_id: number;
  suggested_family_id: number | null;
  confidence: string | null;
  rationale: string | null;
  alternative_family_ids_json: string | null;
  run_number: number;
};

type ReviewDecisionRow = {
  id: number;
  workshop_item_id: number;
  action_type: string;
  selected_family_id: number | null;
  selected_family_name: string | null;
  user_display_name: string | null;
  created_at: Date;
  item_description: string | null;
};

export function mapWorkshopBatchRowToDomain(row: WorkshopBatchRow): WorkshopBatch {
  const status = isWorkshopBatchStatus(row.status) ? row.status : "imported";
  const workflowStage = isWorkshopWorkflowStage(row.workflowStage)
    ? row.workflowStage
    : "imported";

  return {
    id: toWorkshopBatchId(row.id),
    name: row.name,
    description: row.description,
    status,
    workflowStage,
    importItemCount: row.import_item_count,
    itemsPendingReviewCount: row.items_pending_review_count,
    itemsApprovedCount: row.items_approved_count,
    itemsPublishedCount: row.items_published_count,
    latestAiAnalysisId: row.latest_ai_analysis_id,
    scopeProjectId: row.scope_project_id,
    scopeBoqId: row.scope_boq_id,
    linkedBoqVersionId: row.linkedBoqVersionId,
    engineerSubmittedAt: row.engineerSubmittedAt,
    engineerSubmittedBy: row.engineerSubmittedBy,
    sectionHeadApprovedAt: row.sectionHeadApprovedAt,
    sectionHeadApprovedBy: row.sectionHeadApprovedBy,
    returnToEngineerNotes: row.returnToEngineerNotes,
  };
}

export function mapWorkshopItemRowToDomain(row: WorkshopItemRow): WorkshopItem {
  const reviewStatus = isReviewStatus(row.review_status)
    ? row.review_status
    : "pending";

  return {
    id: toWorkshopItemId(row.id),
    batchId: toWorkshopBatchId(row.batch_id),
    sourceBoqItemId: row.source_boq_item_id,
    originalDescription: row.original_description,
    originalUnit: row.original_unit,
    originalItemNo: row.original_item_no,
    originalRowIndex: row.original_row_index,
    originalFamilyId: row.original_family_id
      ? toFamilyId(row.original_family_id)
      : null,
    contextQuantity: row.context_quantity,
    contextSnapshotJson: row.context_snapshot_json,
    latestSuggestedFamilyId: row.latest_suggested_family_id
      ? toFamilyId(row.latest_suggested_family_id)
      : null,
    latestAiConfidence: row.latest_ai_confidence,
    latestAiSuggestionId: row.latest_ai_suggestion_id,
    finalFamilyId: row.final_family_id ? toFamilyId(row.final_family_id) : null,
    reviewStatus,
    aiProcessedAt: row.ai_processed_at,
  };
}

export function mapAiSuggestionRowToDomain(row: AiSuggestionRow): WorkshopAiSuggestion {
  let alternativeFamilyIds: number[] = [];
  if (row.alternative_family_ids_json) {
    try {
      const parsed = JSON.parse(row.alternative_family_ids_json) as unknown;
      if (Array.isArray(parsed)) {
        alternativeFamilyIds = parsed.filter(
          (value): value is number => typeof value === "number",
        );
      }
    } catch {
      alternativeFamilyIds = [];
    }
  }

  return {
    id: row.id,
    workshopItemId: toWorkshopItemId(row.workshop_item_id),
    suggestedFamilyId: row.suggested_family_id
      ? toFamilyId(row.suggested_family_id)
      : null,
    confidence: row.confidence,
    rationale: row.rationale,
    alternativeFamilyIds,
    runNumber: row.run_number,
  };
}

export function mapReviewDecisionRowToDomain(
  row: ReviewDecisionRow,
): WorkshopReviewDecision {
  return {
    id: row.id,
    workshopItemId: toWorkshopItemId(row.workshop_item_id),
    actionType: row.action_type,
    selectedFamilyId: row.selected_family_id
      ? toFamilyId(row.selected_family_id)
      : null,
    selectedFamilyName: row.selected_family_name,
    userDisplayName: row.user_display_name,
    createdAt: row.created_at,
    itemDescription: row.item_description,
  };
}

export type {
  WorkshopBatchRow,
  WorkshopItemRow,
  AiSuggestionRow,
  ReviewDecisionRow,
};
