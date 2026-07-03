import type { WorkshopBatch } from "@/domain/workshop/WorkshopBatch";
import type { WorkshopBatchStatus } from "@/domain/workshop/WorkshopBatchStatus";
import type { WorkshopWorkflowStage } from "@/domain/workshop/WorkshopWorkflowStage";
import type { WorkshopBatchId } from "@/domain/workshop/ids";

export type SaveClassificationBatchCounterDelta = {
  pendingDelta: number;
  approvedDelta: number;
};

export type CreateWorkshopBatchInput = {
  name: string;
  description: string | null;
  scopeProjectId: number;
  scopeBoqId: number;
  importItemCount: number;
  createdBy: string;
  linkedBoqVersionId?: number | null;
};

export type PendingSectionHeadBatchDto = {
  batchId: number;
  batchName: string;
  projectId: number | null;
  boqId: number | null;
  engineerSubmittedAt: string | null;
  pendingItemCount: number;
};

export interface IWorkshopBatchRepository {
  findById(id: WorkshopBatchId): Promise<WorkshopBatch | null>;
  findByName(name: string): Promise<WorkshopBatch | null>;
  listRecent(limit: number): Promise<WorkshopBatch[]>;
  listAwaitingSectionHead(limit?: number): Promise<PendingSectionHeadBatchDto[]>;
  createBatch(input: CreateWorkshopBatchInput): Promise<WorkshopBatch>;
  updateStatus(id: WorkshopBatchId, status: WorkshopBatchStatus): Promise<void>;
  updateWorkflowStage(id: WorkshopBatchId, workflowStage: WorkshopWorkflowStage): Promise<void>;
  submitEngineerReview(
    id: WorkshopBatchId,
    input: { submittedBy: string; submittedAt: Date },
  ): Promise<void>;
  approveSectionHeadReview(
    id: WorkshopBatchId,
    input: { approvedBy: string; approvedAt: Date },
  ): Promise<void>;
  returnToEngineer(
    id: WorkshopBatchId,
    input: { notes: string | null; returnedAt: Date },
  ): Promise<void>;
  updateAfterAiRun(
    id: WorkshopBatchId,
    input: {
      latestAiAnalysisId: number;
      status: WorkshopBatchStatus;
    },
  ): Promise<void>;
  adjustReviewCounters(
    id: WorkshopBatchId,
    delta: SaveClassificationBatchCounterDelta,
  ): Promise<void>;
  incrementPublishedCount(id: WorkshopBatchId, count: number): Promise<void>;
  createAiAnalysis(input: {
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
  }): Promise<number>;
}
