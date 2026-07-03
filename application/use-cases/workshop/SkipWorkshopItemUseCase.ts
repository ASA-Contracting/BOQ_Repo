import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopReview } from "@/application/use-cases/workshop/authorizeWorkshopReview";
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

export type SkipWorkshopItemInput = {
  batchId: number;
  itemId: number;
};

export type SkipWorkshopItemDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopReviewRepository: IWorkshopReviewRepository;
  unitOfWork: IUnitOfWork;
};

export class SkipWorkshopItemUseCase
  implements IUseCase<SkipWorkshopItemInput, { itemId: number }, DomainError>
{
  constructor(private readonly deps: SkipWorkshopItemDependencies) {}

  async execute(
    ctx: RequestContext,
    input: SkipWorkshopItemInput,
  ): Promise<Result<{ itemId: number }, DomainError>> {
    const auth = authorizeWorkshopReview(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const itemId = toWorkshopItemId(input.itemId);

    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const item = await this.deps.workshopItemRepository.findById(itemId, batchId);
    if (!item) {
      return err(new WorkshopItemNotFoundError(itemId));
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });

    const reviewedAt = new Date();
    const wasPending = item.reviewStatus === "pending";

    await this.deps.unitOfWork.runInTransaction(async () => {
      await this.deps.workshopItemRepository.skipItem({
        itemId,
        batchId,
        userId: ctx.userId,
        reviewedAt,
      });

      await this.deps.workshopReviewRepository.insertReviewAction({
        workshopItemId: itemId,
        actionType: "skip",
        previousFamilyId: item.finalFamilyId ?? item.latestSuggestedFamilyId,
        selectedFamilyId: null,
        previousReviewStatus: item.reviewStatus,
        newReviewStatus: "skipped",
        userId: ctx.userId,
        createdAt: reviewedAt,
      });

      if (wasPending) {
        await this.deps.workshopBatchRepository.adjustReviewCounters(batchId, {
          pendingDelta: -1,
          approvedDelta: 0,
        });
      }
    });

    return ok({ itemId: input.itemId });
  }
}
