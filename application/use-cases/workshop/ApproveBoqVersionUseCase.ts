import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeSectionHeadApproval } from "@/application/use-cases/workshop/authorizeSectionHeadApproval";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { toBoqId, toBoqVersionId } from "@/domain/boq/ids";
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

export type ApproveBoqVersionInput = {
  batchId: number;
};

export type ApproveBoqVersionResult = {
  batchId: number;
  versionName: string;
  versionNumber: number;
};

export type ApproveBoqVersionDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  boqVersionRepository: IBoqVersionRepository;
  unitOfWork: IUnitOfWork;
};

export class ApproveBoqVersionUseCase
  implements IUseCase<ApproveBoqVersionInput, ApproveBoqVersionResult, DomainError>
{
  constructor(private readonly deps: ApproveBoqVersionDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ApproveBoqVersionInput,
  ): Promise<Result<ApproveBoqVersionResult, DomainError>> {
    const auth = authorizeSectionHeadApproval(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    if (batch.workflowStage !== "awaiting_section_head") {
      return err(
        new WorkshopWorkflowError(
          "Batch is not awaiting section-head approval.",
        ),
      );
    }

    if (!batch.linkedBoqVersionId || !batch.scopeBoqId) {
      return err(
        new WorkshopWorkflowError("Batch is not linked to a BOQ version."),
      );
    }

    const linkedVersion = await this.deps.boqVersionRepository.findById(
      toBoqVersionId(batch.linkedBoqVersionId),
    );
    if (!linkedVersion) {
      return err(new WorkshopWorkflowError("Linked BOQ version was not found."));
    }

    const versionNumber =
      linkedVersion.versionNumber ??
      (await this.deps.boqVersionRepository.getNextVersionNumber(
        toBoqId(batch.scopeBoqId),
      ));

    const versionName = `Version ${versionNumber}`;
    const now = new Date();

    await this.deps.unitOfWork.runInTransaction(async () => {
      await this.deps.boqVersionRepository.updateApprovalStatus(
        toBoqVersionId(batch.linkedBoqVersionId!),
        {
          approvalStatus: "approved",
          versionName,
          versionNumber,
        },
      );

      await this.deps.workshopBatchRepository.approveSectionHeadReview(batchId, {
        approvedBy: ctx.userId,
        approvedAt: now,
      });
    });

    return ok({
      batchId: input.batchId,
      versionName,
      versionNumber,
    });
  }
}
