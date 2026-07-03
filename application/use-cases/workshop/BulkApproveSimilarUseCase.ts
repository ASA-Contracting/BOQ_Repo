import type { BulkApproveSimilarInput } from "@/application/dto/workshop/importBoqSchema";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopReview } from "@/application/use-cases/workshop/authorizeWorkshopReview";
import { toFamilyId } from "@/domain/family/ids";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import {
  WorkshopBatchNotFoundError,
  WorkshopItemNotFoundError,
} from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId, toWorkshopItemId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type {
  IWorkshopItemRepository,
  IWorkshopReviewRepository,
} from "@/domain/workshop/repositories/IWorkshopItemRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

export type BulkApproveSimilarResult = {
  approvedCount: number;
};

export type BulkApproveSimilarDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopReviewRepository: IWorkshopReviewRepository;
  unitOfWork: IUnitOfWork;
};

export class BulkApproveSimilarUseCase
  implements IUseCase<BulkApproveSimilarInput, BulkApproveSimilarResult, DomainError>
{
  constructor(private readonly deps: BulkApproveSimilarDependencies) {}

  async execute(
    ctx: RequestContext,
    input: BulkApproveSimilarInput,
  ): Promise<Result<BulkApproveSimilarResult, DomainError>> {
    const auth = authorizeWorkshopReview(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const sourceItemId = toWorkshopItemId(input.sourceItemId);
    const selectedFamilyId = toFamilyId(input.familyId);
    const targetItemIds = input.similarItemIds.map((id) => toWorkshopItemId(id));

    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const sourceItem = await this.deps.workshopItemRepository.findById(
      sourceItemId,
      batchId,
    );
    if (!sourceItem) {
      return err(new WorkshopItemNotFoundError(sourceItemId));
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });
    const reviewedAt = new Date();

    const approvedCount = await this.deps.unitOfWork.runInTransaction(async () => {
      const count = await this.deps.workshopItemRepository.bulkApproveItems({
        batchId,
        itemIds: targetItemIds,
        selectedFamilyId,
        userId: ctx.userId,
        reviewedAt,
      });

      for (const itemId of targetItemIds) {
        await this.deps.workshopReviewRepository.insertReviewAction({
          workshopItemId: itemId,
          actionType: "accept_ai",
          previousFamilyId: null,
          selectedFamilyId,
          previousReviewStatus: "pending",
          newReviewStatus: "approved",
          userId: ctx.userId,
          createdAt: reviewedAt,
        });
      }

      if (count > 0) {
        await this.deps.workshopBatchRepository.adjustReviewCounters(batchId, {
          pendingDelta: -count,
          approvedDelta: count,
        });
      }

      return count;
    });

    return ok({ approvedCount });
  }
}
