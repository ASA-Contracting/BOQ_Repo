import type { CategorizationBatchContextDto } from "@/application/dto/workshop/categorizationDto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { toBoqVersionId } from "@/domain/boq/ids";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { WorkshopBatchNotFoundError } from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type GetCategorizationBatchContextInput = {
  batchId: number;
};

export type GetCategorizationBatchContextDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  boqVersionRepository: IBoqVersionRepository;
};

export class GetCategorizationBatchContextUseCase
  implements IUseCase<GetCategorizationBatchContextInput, CategorizationBatchContextDto, DomainError>
{
  constructor(private readonly deps: GetCategorizationBatchContextDependencies) {}

  async execute(
    ctx: RequestContext,
    input: GetCategorizationBatchContextInput,
  ): Promise<Result<CategorizationBatchContextDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const [reviewedCount, totalCount, linkedVersion] = await Promise.all([
      this.deps.workshopItemRepository.countReviewed(batchId),
      this.deps.workshopItemRepository.countTotal(batchId),
      batch.linkedBoqVersionId
        ? this.deps.boqVersionRepository.findById(
            toBoqVersionId(batch.linkedBoqVersionId),
          )
        : Promise.resolve(null),
    ]);

    return ok({
      batch: {
        id: batch.id as number,
        name: batch.name,
        status: batch.status,
        workflowStage: batch.workflowStage,
        importItemCount: batch.importItemCount,
        itemsApprovedCount: batch.itemsApprovedCount,
        itemsPendingReviewCount: batch.itemsPendingReviewCount,
        latestAiAnalysisId: batch.latestAiAnalysisId,
        linkedBoqVersionId: batch.linkedBoqVersionId,
        versionName: linkedVersion?.versionName ?? null,
        versionNumber: linkedVersion?.versionNumber ?? null,
        approvalStatus: linkedVersion?.approvalStatus ?? null,
        returnToEngineerNotes: batch.returnToEngineerNotes,
      },
      reviewedCount,
      totalCount,
      hasAiRun: batch.latestAiAnalysisId !== null,
    });
  }
}
