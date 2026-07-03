import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeEngineerSubmit } from "@/application/use-cases/workshop/authorizeEngineerSubmit";
import { toBoqVersionId } from "@/domain/boq/ids";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import {
  WorkshopBatchNotFoundError,
  WorkshopWorkflowError,
} from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type SubmitEngineerReviewInput = {
  batchId: number;
};

export type SubmitEngineerReviewResult = {
  batchId: number;
};

export type SubmitEngineerReviewDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  boqVersionRepository: IBoqVersionRepository;
  unitOfWork: IUnitOfWork;
};

export class SubmitEngineerReviewUseCase
  implements IUseCase<SubmitEngineerReviewInput, SubmitEngineerReviewResult, DomainError>
{
  constructor(private readonly deps: SubmitEngineerReviewDependencies) {}

  async execute(
    ctx: RequestContext,
    input: SubmitEngineerReviewInput,
  ): Promise<Result<SubmitEngineerReviewResult, DomainError>> {
    const auth = authorizeEngineerSubmit(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    if (
      batch.workflowStage !== "ready_for_engineer_review" &&
      batch.workflowStage !== "imported"
    ) {
      return err(
        new WorkshopWorkflowError(
          "Batch is not ready for engineer submission.",
        ),
      );
    }

    const pendingCount = await this.deps.workshopItemRepository.countPendingReview(batchId);
    if (pendingCount > 0) {
      return err(
        new WorkshopWorkflowError(
          `${pendingCount} item(s) still pending review. Complete or skip all items before submitting.`,
        ),
      );
    }

    const now = new Date();

    await this.deps.unitOfWork.runInTransaction(async () => {
      await this.deps.workshopBatchRepository.submitEngineerReview(batchId, {
        submittedBy: ctx.userId,
        submittedAt: now,
      });

      if (batch.linkedBoqVersionId) {
        await this.deps.boqVersionRepository.updateApprovalStatus(
          toBoqVersionId(batch.linkedBoqVersionId),
          { approvalStatus: "pending_section_head" },
        );
      }
    });

    return ok({ batchId: input.batchId });
  }
}
