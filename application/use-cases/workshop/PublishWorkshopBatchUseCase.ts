import type { PublishBatchInput } from "@/application/dto/workshop/importBoqSchema";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopPublish } from "@/application/use-cases/workshop/authorizeWorkshopPublish";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import {
  WorkshopBatchNotFoundError,
  WorkshopNothingToPublishError,
  WorkshopPublishNotCompleteError,
} from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId } from "@/domain/workshop/ids";
import { toBoqItemId } from "@/domain/boq/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopExportRepository } from "@/domain/workshop/repositories/IWorkshopExportRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

export type PublishWorkshopBatchResult = {
  batchId: number;
  exportBatchId: number;
  publishedCount: number;
};

export type PublishWorkshopBatchDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopExportRepository: IWorkshopExportRepository;
  unitOfWork: IUnitOfWork;
};

export class PublishWorkshopBatchUseCase
  implements IUseCase<PublishBatchInput, PublishWorkshopBatchResult, DomainError>
{
  constructor(private readonly deps: PublishWorkshopBatchDependencies) {}

  async execute(
    ctx: RequestContext,
    input: PublishBatchInput,
  ): Promise<Result<PublishWorkshopBatchResult, DomainError>> {
    const auth = authorizeWorkshopPublish(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const publishPolicy = input.publishPolicy ?? "partial";

    if (publishPolicy === "full") {
      const pendingCount = await this.deps.workshopItemRepository.countPendingReview(batchId);
      if (pendingCount > 0) {
        return err(new WorkshopPublishNotCompleteError(pendingCount));
      }
    }

    const items = await this.deps.workshopItemRepository.listApprovedForPublish(batchId);
    if (items.length === 0) {
      return err(new WorkshopNothingToPublishError());
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });

    const startedAt = new Date();

    const result = await this.deps.unitOfWork.runInTransaction(async () => {
      const exportBatchId = await this.deps.workshopExportRepository.createExportBatch({
        batchId,
        requestedBy: ctx.userId,
        totalItems: items.length,
        publishPolicySnapshot: publishPolicy,
        startedAt,
      });

      let succeededCount = 0;

      for (const item of items) {
        if (!item.finalFamilyId) {
          continue;
        }

        const sourceBoqItemId = toBoqItemId(item.sourceBoqItemId);
        const oldFamilyId = await this.deps.workshopExportRepository.readProductionFamilyId(
          sourceBoqItemId,
        );
        const publishedAt = new Date();

        await this.deps.workshopExportRepository.updateProductionFamilyId(
          sourceBoqItemId,
          item.finalFamilyId,
          publishedAt,
        );

        const auditTrailId = await this.deps.workshopExportRepository.insertAuditTrail({
          userId: ctx.userId,
          userName: null,
          entityId: String(item.sourceBoqItemId),
          oldFamilyId,
          newFamilyId: item.finalFamilyId,
          timestamp: publishedAt,
        });

        const exportItemId = await this.deps.workshopExportRepository.insertExportItem({
          exportBatchId,
          workshopItemId: item.id,
          sourceBoqItemId,
          oldFamilyId,
          newFamilyId: item.finalFamilyId,
          auditTrailId,
          publishedAt,
        });

        await this.deps.workshopExportRepository.markWorkshopItemPublished({
          workshopItemId: item.id,
          batchId,
          publishedBy: ctx.userId,
          publishedAt,
          exportItemId,
          productionFamilyIdAtCheck: item.finalFamilyId,
        });

        succeededCount += 1;
      }

      await this.deps.workshopExportRepository.completeExportBatch({
        exportBatchId,
        publishedBy: ctx.userId,
        succeededCount,
        failedCount: 0,
        skippedCount: 0,
        completedAt: new Date(),
        errorSummary: null,
      });

      await this.deps.workshopBatchRepository.incrementPublishedCount(batchId, succeededCount);

      return { exportBatchId, publishedCount: succeededCount };
    });

    return ok({
      batchId: input.batchId,
      exportBatchId: result.exportBatchId,
      publishedCount: result.publishedCount,
    });
  }
}
