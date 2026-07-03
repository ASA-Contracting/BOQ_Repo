import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopReview } from "@/application/use-cases/workshop/authorizeWorkshopReview";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ImportCampaignNotFoundError } from "@/domain/workshop/errors/WorkshopErrors";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type GetNextWorkshopItemInCampaignInput = {
  campaignId: number;
};

export type GetNextWorkshopItemInCampaignResult = {
  batchId: number | null;
  itemId: number | null;
};

export class GetNextWorkshopItemInCampaignUseCase
  implements
    IUseCase<
      GetNextWorkshopItemInCampaignInput,
      GetNextWorkshopItemInCampaignResult,
      DomainError
    >
{
  constructor(
    private readonly deps: {
      importCampaignRepository: IImportCampaignRepository;
      workshopItemRepository: IWorkshopItemRepository;
    },
  ) {}

  async execute(
    ctx: RequestContext,
    input: GetNextWorkshopItemInCampaignInput,
  ): Promise<Result<GetNextWorkshopItemInCampaignResult, DomainError>> {
    const auth = authorizeWorkshopReview(ctx);
    if (!auth.ok) {
      return auth;
    }

    const campaign = await this.deps.importCampaignRepository.findById(input.campaignId);
    if (!campaign) {
      return err(new ImportCampaignNotFoundError(input.campaignId));
    }

    const next = await this.deps.workshopItemRepository.findFirstInCampaignQueue(
      input.campaignId,
    );

    if (!next) {
      return ok({ batchId: null, itemId: null });
    }

    return ok({
      batchId: next.batchId as number,
      itemId: next.itemId as number,
    });
  }
}
