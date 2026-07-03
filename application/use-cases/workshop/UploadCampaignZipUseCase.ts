import type { ImportCampaignDto } from "@/application/dto/workshop/campaignDto";
import type { UploadCampaignZipInput } from "@/application/dto/workshop/importBoqSchema";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ImportCampaignNotFoundError, WorkshopEmptyZipError } from "@/domain/workshop/errors/WorkshopErrors";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";
import { extractExcelFilesFromZip } from "@/infrastructure/storage/ZipExcelExtractor";

export type UploadCampaignZipResult = {
  campaign: ImportCampaignDto;
  enqueuedFiles: number;
};

export type UploadCampaignZipDependencies = {
  importCampaignRepository: IImportCampaignRepository;
};

export class UploadCampaignZipUseCase
  implements IUseCase<UploadCampaignZipInput, UploadCampaignZipResult, DomainError>
{
  constructor(private readonly deps: UploadCampaignZipDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UploadCampaignZipInput,
  ): Promise<Result<UploadCampaignZipResult, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const campaign = await this.deps.importCampaignRepository.findById(input.campaignId);
    if (!campaign) {
      return err(new ImportCampaignNotFoundError(input.campaignId));
    }

    const extracted = await extractExcelFilesFromZip(input.zipBase64);
    if (extracted.length === 0) {
      return err(new WorkshopEmptyZipError());
    }

    await this.deps.importCampaignRepository.createJobs(
      extracted.map((file) => ({
        campaignId: input.campaignId,
        fileName: file.fileName,
        fileContentBase64: file.base64,
        columnMappingJson: campaign.defaultColumnMappingJson,
      })),
    );

    await this.deps.importCampaignRepository.adjustCampaignCounters(input.campaignId, {
      totalFiles: extracted.length,
    });
    await this.deps.importCampaignRepository.updateCampaignStatus(
      input.campaignId,
      "processing",
    );

    return ok({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: "processing",
        totalFiles: campaign.totalFiles + extracted.length,
        importedCount: campaign.importedCount,
        aiCompleteCount: campaign.aiCompleteCount,
        failedCount: campaign.failedCount,
      },
      enqueuedFiles: extracted.length,
    });
  }
}
