import type { ReviewStatus } from "@/domain/workshop/ReviewStatus";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";
import type { FamilyId } from "@/domain/family/ids";

export type WorkshopItem = {
  id: WorkshopItemId;
  batchId: WorkshopBatchId;
  sourceBoqItemId: number;
  originalDescription: string | null;
  originalUnit: string | null;
  originalItemNo: string | null;
  originalRowIndex: number;
  originalFamilyId: FamilyId | null;
  contextQuantity: string | null;
  contextSnapshotJson: string | null;
  latestSuggestedFamilyId: FamilyId | null;
  latestAiConfidence: string | null;
  latestAiSuggestionId: number | null;
  finalFamilyId: FamilyId | null;
  reviewStatus: ReviewStatus;
  aiProcessedAt: Date | null;
};

export type WorkshopAiSuggestion = {
  id: number;
  workshopItemId: WorkshopItemId;
  suggestedFamilyId: FamilyId | null;
  confidence: string | null;
  rationale: string | null;
  alternativeFamilyIds: number[];
  runNumber: number;
};

export type WorkshopReviewDecision = {
  id: number;
  workshopItemId: WorkshopItemId;
  actionType: string;
  selectedFamilyId: FamilyId | null;
  selectedFamilyName: string | null;
  userDisplayName: string | null;
  createdAt: Date;
  itemDescription: string | null;
};
