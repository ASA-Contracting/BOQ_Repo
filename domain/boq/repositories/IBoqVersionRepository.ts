import type { BoqId, BoqVersionId } from "@/domain/boq/ids";
import type { BoqVersionApprovalStatus } from "@/domain/workshop/WorkshopWorkflowStage";

export type BoqVersionRecord = {
  id: number;
  boqId: number;
  versionNumber: number | null;
  versionName: string | null;
  approvalStatus: string;
};

export interface IBoqVersionRepository {
  findById(versionId: BoqVersionId): Promise<BoqVersionRecord | null>;
  getNextVersionNumber(boqId: BoqId): Promise<number>;
  updateApprovalStatus(
    versionId: BoqVersionId,
    input: {
      approvalStatus: BoqVersionApprovalStatus;
      versionName?: string;
      versionNumber?: number;
    },
  ): Promise<void>;
  duplicateAsDraft(input: {
    boqId: BoqId;
    sourceVersionId: BoqVersionId;
    createdBy: string;
  }): Promise<{ versionId: BoqVersionId }>;
}
