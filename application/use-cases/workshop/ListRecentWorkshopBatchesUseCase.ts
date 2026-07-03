import type { WorkshopBatchSummaryDto } from "@/application/dto/workshop/categorizationDto";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";

export type ListRecentWorkshopBatchesDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
};

function mapBatch(batch: import("@/domain/workshop/WorkshopBatch").WorkshopBatch): WorkshopBatchSummaryDto {
  return {
    id: batch.id as number,
    name: batch.name,
    status: batch.status,
    workflowStage: batch.workflowStage,
    importItemCount: batch.importItemCount,
    itemsApprovedCount: batch.itemsApprovedCount,
    itemsPendingReviewCount: batch.itemsPendingReviewCount,
    latestAiAnalysisId: batch.latestAiAnalysisId,
    linkedBoqVersionId: batch.linkedBoqVersionId,
    versionName: null,
    versionNumber: null,
    approvalStatus: null,
    returnToEngineerNotes: batch.returnToEngineerNotes,
  };
}

export class ListRecentWorkshopBatchesUseCase
  implements IUseCaseWithoutInput<WorkshopBatchSummaryDto[], DomainError>
{
  constructor(private readonly deps: ListRecentWorkshopBatchesDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<WorkshopBatchSummaryDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batches = await this.deps.workshopBatchRepository.listRecent(10);
    return ok(batches.map(mapBatch));
  }
}
