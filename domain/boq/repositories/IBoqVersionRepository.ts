import type { BoqId, BoqVersionId } from "@/domain/boq/ids";
import type { BoqVersionApprovalStatus } from "@/domain/workshop/WorkshopWorkflowStage";

export interface IBoqVersionRepository {
  findById(versionId: BoqVersionId): Promise<{
    id: number;
    boqId: number;
    versionNumber: number | null;
    versionName: string | null;
    approvalStatus: string;
  } | null>;
  getNextVersionNumber(boqId: BoqId): Promise<number>;
  updateApprovalStatus(
    versionId: BoqVersionId,
    input: {
      approvalStatus: BoqVersionApprovalStatus;
      versionName?: string;
      versionNumber?: number;
    },
  ): Promise<void>;
}
