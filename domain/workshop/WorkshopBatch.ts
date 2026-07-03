import type { WorkshopBatchStatus } from "@/domain/workshop/WorkshopBatchStatus";
import type { WorkshopWorkflowStage } from "@/domain/workshop/WorkshopWorkflowStage";
import type { WorkshopBatchId } from "@/domain/workshop/ids";

export type WorkshopBatch = {
  id: WorkshopBatchId;
  name: string;
  description: string | null;
  status: WorkshopBatchStatus;
  workflowStage: WorkshopWorkflowStage;
  importItemCount: number;
  itemsPendingReviewCount: number;
  itemsApprovedCount: number;
  itemsPublishedCount: number;
  latestAiAnalysisId: number | null;
  scopeProjectId: number | null;
  scopeBoqId: number | null;
  linkedBoqVersionId: number | null;
  engineerSubmittedAt: Date | null;
  engineerSubmittedBy: string | null;
  sectionHeadApprovedAt: Date | null;
  sectionHeadApprovedBy: string | null;
  returnToEngineerNotes: string | null;
};
