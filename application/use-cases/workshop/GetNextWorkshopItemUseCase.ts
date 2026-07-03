import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import {
  WorkshopBatchNotFoundError,
  WorkshopQueueEmptyError,
} from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId, toWorkshopItemId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type NavigateWorkshopItemInput = {
  batchId: number;
  currentItemId?: number;
};

export type NavigateWorkshopItemResult = {
  itemId: number | null;
};

export type NavigateWorkshopItemDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
};

export class GetNextWorkshopItemUseCase
  implements IUseCase<NavigateWorkshopItemInput, NavigateWorkshopItemResult, DomainError>
{
  constructor(private readonly deps: NavigateWorkshopItemDependencies) {}

  async execute(
    ctx: RequestContext,
    input: NavigateWorkshopItemInput,
  ): Promise<Result<NavigateWorkshopItemResult, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const nextItem = input.currentItemId
      ? await this.deps.workshopItemRepository.findNextInQueue(
          batchId,
          toWorkshopItemId(input.currentItemId),
        )
      : await this.deps.workshopItemRepository.findFirstInQueue(batchId);

    if (!nextItem) {
      return err(new WorkshopQueueEmptyError());
    }

    return ok({ itemId: nextItem.id as number });
  }
}

export class GetPreviousWorkshopItemUseCase
  implements IUseCase<NavigateWorkshopItemInput, NavigateWorkshopItemResult, DomainError>
{
  constructor(private readonly deps: NavigateWorkshopItemDependencies) {}

  async execute(
    ctx: RequestContext,
    input: NavigateWorkshopItemInput,
  ): Promise<Result<NavigateWorkshopItemResult, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    if (!input.currentItemId) {
      return err(new WorkshopQueueEmptyError());
    }

    const previousItem = await this.deps.workshopItemRepository.findPreviousInQueue(
      batchId,
      toWorkshopItemId(input.currentItemId),
    );

    if (!previousItem) {
      return err(new WorkshopQueueEmptyError());
    }

    return ok({ itemId: previousItem.id as number });
  }
}
