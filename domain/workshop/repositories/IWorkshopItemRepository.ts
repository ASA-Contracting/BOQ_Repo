import type { ReviewActionType } from "@/domain/workshop/ReviewActionType";
import type { ReviewStatus } from "@/domain/workshop/ReviewStatus";
import type {
  WorkshopAiSuggestion,
  WorkshopItem,
  WorkshopReviewDecision,
} from "@/domain/workshop/WorkshopItem";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";
import type { FamilyId } from "@/domain/family/ids";

export type SaveWorkshopClassificationInput = {
  itemId: WorkshopItemId;
  batchId: WorkshopBatchId;
  selectedFamilyId: FamilyId;
  actionType: ReviewActionType;
  previousFamilyId: FamilyId | null;
  previousReviewStatus: ReviewStatus;
  newReviewStatus: ReviewStatus;
  userId: string;
  reviewedAt: Date;
};

export type PersistAiSuggestionInput = {
  workshopItemId: WorkshopItemId;
  aiAnalysisId: number;
  runNumber: number;
  suggestedFamilyId: FamilyId;
  confidence: number;
  rationale: string;
  alternativeFamilyIds: number[];
  modelName: string;
  promptVersion: string;
  createdBy: string | null;
};

export type CreateWorkshopItemInput = {
  batchId: WorkshopBatchId;
  sourceBoqItemId: number;
  sourceBoqId: number;
  sourceProjectId: number;
  originalFamilyId?: number | null;
  originalDescription: string | null;
  originalUnit: string | null;
  originalItemNo: string | null;
  originalRowIndex: number;
  originalIsHeader: boolean;
  originalIsMeasurable: boolean;
  contextQuantity: string | null;
  contextUnitRate?: string | null;
  contextBoqVersionId?: number | null;
  contextSnapshotJson: string | null;
  importedAt: Date;
};

export interface IWorkshopItemRepository {
  createWorkshopItems(items: CreateWorkshopItemInput[]): Promise<WorkshopItemId[]>;
  skipItem(input: {
    itemId: WorkshopItemId;
    batchId: WorkshopBatchId;
    userId: string;
    reviewedAt: Date;
  }): Promise<void>;
  findById(id: WorkshopItemId, batchId: WorkshopBatchId): Promise<WorkshopItem | null>;
  findFirstInQueue(batchId: WorkshopBatchId): Promise<WorkshopItem | null>;
  findNextInQueue(
    batchId: WorkshopBatchId,
    currentItemId: WorkshopItemId,
  ): Promise<WorkshopItem | null>;
  findPreviousInQueue(
    batchId: WorkshopBatchId,
    currentItemId: WorkshopItemId,
  ): Promise<WorkshopItem | null>;
  listForAiRun(batchId: WorkshopBatchId): Promise<WorkshopItem[]>;
  countReviewed(batchId: WorkshopBatchId): Promise<number>;
  countTotal(batchId: WorkshopBatchId): Promise<number>;
  getSuggestionsForItem(itemId: WorkshopItemId): Promise<WorkshopAiSuggestion[]>;
  saveClassification(input: SaveWorkshopClassificationInput): Promise<void>;
  persistAiSuggestion(input: PersistAiSuggestionInput): Promise<number>;
  updateItemAfterAiSuggestion(
    itemId: WorkshopItemId,
    input: {
      latestSuggestedFamilyId: FamilyId;
      latestAiConfidence: number;
      latestAiSuggestionId: number;
      aiProcessedAt: Date;
    },
  ): Promise<void>;
  listSimilarItems(
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
  >;
  listApprovedForPublish(batchId: WorkshopBatchId): Promise<WorkshopItem[]>;
  countPendingReview(batchId: WorkshopBatchId): Promise<number>;
  findFirstInCampaignQueue(
    campaignId: number,
  ): Promise<{ batchId: WorkshopBatchId; itemId: WorkshopItemId } | null>;
  bulkApproveItems(input: {
    batchId: WorkshopBatchId;
    itemIds: WorkshopItemId[];
    selectedFamilyId: FamilyId;
    userId: string;
    reviewedAt: Date;
  }): Promise<number>;
}

export interface IWorkshopReviewRepository {
  insertReviewAction(input: {
    workshopItemId: WorkshopItemId;
    actionType: ReviewActionType;
    previousFamilyId: FamilyId | null;
    selectedFamilyId: FamilyId | null;
    previousReviewStatus: ReviewStatus;
    newReviewStatus: ReviewStatus;
    userId: string;
    createdAt: Date;
  }): Promise<void>;
  listPriorDecisions(
    description: string,
    limit: number,
  ): Promise<WorkshopReviewDecision[]>;
}
