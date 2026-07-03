import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeSectionHeadApproval } from "@/application/use-cases/workshop/authorizeSectionHeadApproval";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { toBoqVersionId } from "@/domain/boq/ids";
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

export type ReturnBoqVersionToEngineerInput = {
  batchId: number;
  notes?: string;
};

export type ReturnBoqVersionToEngineerResult = {
  batchId: number;
};

export type ReturnBoqVersionToEngineerDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  boqVersionRepository: IBoqVersionRepository;
  unitOfWork: IUnitOfWork;
};

export class ReturnBoqVersionToEngineerUseCase
  implements
    IUseCase<
      ReturnBoqVersionToEngineerInput,
      ReturnBoqVersionToEngineerResult,
      DomainError
    >
{
  constructor(private readonly deps: ReturnBoqVersionToEngineerDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ReturnBoqVersionToEngineerInput,
  ): Promise<Result<ReturnBoqVersionToEngineerResult, DomainError>> {
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
          "Only batches awaiting section-head review can be returned.",
        ),
      );
    }

    const now = new Date();

    await this.deps.unitOfWork.runInTransaction(async () => {
      await this.deps.workshopBatchRepository.returnToEngineer(batchId, {
        notes: input.notes?.trim() || null,
        returnedAt: now,
      });

      if (batch.linkedBoqVersionId) {
        await this.deps.boqVersionRepository.updateApprovalStatus(
          toBoqVersionId(batch.linkedBoqVersionId),
          { approvalStatus: "draft" },
        );
      }
    });

    return ok({ batchId: input.batchId });
  }
}
