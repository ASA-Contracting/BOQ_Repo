import type { SaveClassificationInput } from "@/application/dto/workshop/importBoqSchema";
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
import type { ReviewActionType } from "@/domain/workshop/ReviewActionType";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type {
  IWorkshopItemRepository,
  IWorkshopReviewRepository,
} from "@/domain/workshop/repositories/IWorkshopItemRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

export type SaveWorkshopItemClassificationDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopReviewRepository: IWorkshopReviewRepository;
  unitOfWork: IUnitOfWork;
};

export class SaveWorkshopItemClassificationUseCase
  implements IUseCase<SaveClassificationInput, { itemId: number }, DomainError>
{
  constructor(private readonly deps: SaveWorkshopItemClassificationDependencies) {}

  async execute(
    ctx: RequestContext,
    input: SaveClassificationInput,
  ): Promise<Result<{ itemId: number }, DomainError>> {
    const auth = authorizeWorkshopReview(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const itemId = toWorkshopItemId(input.itemId);
    const selectedFamilyId = toFamilyId(input.familyId);

    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const item = await this.deps.workshopItemRepository.findById(itemId, batchId);
    if (!item) {
      return err(new WorkshopItemNotFoundError(itemId));
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });

    const suggestions = await this.deps.workshopItemRepository.getSuggestionsForItem(itemId);
    const topSuggestion = suggestions[0];
    const actionType: ReviewActionType =
      topSuggestion?.suggestedFamilyId === selectedFamilyId
        ? "accept_ai"
        : "override_ai";

    const reviewedAt = new Date();
    const wasPending = item.reviewStatus === "pending";

    await this.deps.unitOfWork.runInTransaction(async () => {
      await this.deps.workshopItemRepository.saveClassification({
        itemId,
        batchId,
        selectedFamilyId,
        actionType,
        previousFamilyId: item.finalFamilyId ?? item.latestSuggestedFamilyId,
        previousReviewStatus: item.reviewStatus,
        newReviewStatus: "approved",
        userId: ctx.userId,
        reviewedAt,
      });

      await this.deps.workshopReviewRepository.insertReviewAction({
        workshopItemId: itemId,
        actionType,
        previousFamilyId: item.finalFamilyId ?? item.latestSuggestedFamilyId,
        selectedFamilyId,
        previousReviewStatus: item.reviewStatus,
        newReviewStatus: "approved",
        userId: ctx.userId,
        createdAt: reviewedAt,
      });

      if (wasPending) {
        await this.deps.workshopBatchRepository.adjustReviewCounters(batchId, {
          pendingDelta: -1,
          approvedDelta: 1,
        });
      }
    });

    return ok({ itemId: input.itemId });
  }
}
