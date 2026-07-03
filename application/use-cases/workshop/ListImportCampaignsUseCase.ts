import type {
  ImportCampaignDetailDto,
  ImportCampaignDto,
} from "@/application/dto/workshop/campaignDto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";

export class ListImportCampaignsUseCase
  implements IUseCase<{ limit?: number }, ImportCampaignDto[], DomainError>
{
  constructor(
    private readonly deps: { importCampaignRepository: IImportCampaignRepository },
  ) {}

  async execute(
    ctx: RequestContext,
    input: { limit?: number },
  ): Promise<Result<ImportCampaignDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const campaigns = await this.deps.importCampaignRepository.listRecent(input.limit ?? 20);
    return ok(
      campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalFiles: campaign.totalFiles,
        importedCount: campaign.importedCount,
        aiCompleteCount: campaign.aiCompleteCount,
        failedCount: campaign.failedCount,
      })),
    );
  }
}

export class GetImportCampaignDetailUseCase
  implements IUseCase<{ campaignId: number }, ImportCampaignDetailDto, DomainError>
{
  constructor(
    private readonly deps: { importCampaignRepository: IImportCampaignRepository },
  ) {}

  async execute(
    ctx: RequestContext,
    input: { campaignId: number },
  ): Promise<Result<ImportCampaignDetailDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const campaign = await this.deps.importCampaignRepository.findById(input.campaignId);
    if (!campaign) {
      return ok({
        campaign: {
          id: input.campaignId,
          name: "Unknown",
          status: "draft",
          totalFiles: 0,
          importedCount: 0,
          aiCompleteCount: 0,
          failedCount: 0,
        },
        jobs: [],
      });
    }

    const jobs = await this.deps.importCampaignRepository.listJobsByCampaign(input.campaignId);

    return ok({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalFiles: campaign.totalFiles,
        importedCount: campaign.importedCount,
        aiCompleteCount: campaign.aiCompleteCount,
        failedCount: campaign.failedCount,
      },
      jobs: jobs.map((job) => ({
        id: job.id,
        fileName: job.fileName,
        status: job.status,
        workshopBatchId: job.workshopBatchId,
        errorMessage: job.errorMessage,
      })),
    });
  }
}
