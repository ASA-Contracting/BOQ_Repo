import type { ImportCampaignDto } from "@/application/dto/workshop/campaignDto";
import type { CreateCampaignInput } from "@/application/dto/workshop/importBoqSchema";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

function mapCampaign(campaign: {
  id: number;
  name: string;
  status: string;
  totalFiles: number;
  importedCount: number;
  aiCompleteCount: number;
  failedCount: number;
}): ImportCampaignDto {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    totalFiles: campaign.totalFiles,
    importedCount: campaign.importedCount,
    aiCompleteCount: campaign.aiCompleteCount,
    failedCount: campaign.failedCount,
  };
}

export type CreateImportCampaignDependencies = {
  importCampaignRepository: IImportCampaignRepository;
};

export class CreateImportCampaignUseCase
  implements IUseCase<CreateCampaignInput, ImportCampaignDto, DomainError>
{
  constructor(private readonly deps: CreateImportCampaignDependencies) {}

  async execute(
    ctx: RequestContext,
    input: CreateCampaignInput,
  ): Promise<Result<ImportCampaignDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });

    const campaign = await this.deps.importCampaignRepository.createCampaign({
      name: input.name,
      defaultColumnMappingJson: input.defaultColumnMapping
        ? JSON.stringify(input.defaultColumnMapping)
        : null,
      createdBy: ctx.userId,
    });

    return ok(mapCampaign(campaign));
  }
}
