import type { ProcessJobsInput } from "@/application/dto/workshop/importBoqSchema";
import type { IExcelParser } from "@/application/ports/IExcelParser";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import {
  batchNameFromFileName,
  inferColumnMapping,
} from "@/application/use-cases/workshop/autoColumnMapping";
import { authorizeWorkshopImport } from "@/application/use-cases/workshop/authorizeWorkshopImport";
import type { ImportBoqFromExcelUseCase } from "@/application/use-cases/workshop/ImportBoqFromExcelUseCase";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ImportCampaignNotFoundError } from "@/domain/workshop/errors/WorkshopErrors";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";
import type { columnMappingSchema } from "@/application/dto/workshop/importBoqSchema";
import type { z } from "zod";

export type ProcessImportJobsResult = {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
};

export type ProcessImportJobsDependencies = {
  importCampaignRepository: IImportCampaignRepository;
  excelParser: IExcelParser;
  importBoqFromExcelUseCase: ImportBoqFromExcelUseCase;
};

export class ProcessImportJobsUseCase
  implements IUseCase<ProcessJobsInput, ProcessImportJobsResult, DomainError>
{
  constructor(private readonly deps: ProcessImportJobsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ProcessJobsInput,
  ): Promise<Result<ProcessImportJobsResult, DomainError>> {
    const auth = authorizeWorkshopImport(ctx);
    if (!auth.ok) {
      return auth;
    }

    const campaign = await this.deps.importCampaignRepository.findById(input.campaignId);
    if (!campaign) {
      return err(new ImportCampaignNotFoundError(input.campaignId));
    }

    const maxJobs = input.maxJobs ?? 1;
    let processedCount = 0;
    let succeededCount = 0;
    let failedCount = 0;

    while (processedCount < maxJobs) {
      const job = await this.deps.importCampaignRepository.claimNextPendingJob(
        input.campaignId,
      );
      if (!job?.fileContentBase64) {
        break;
      }

      processedCount += 1;

      try {
        const buffer = Buffer.from(job.fileContentBase64, "base64");
        const parsed = this.deps.excelParser.parse(buffer);
        const columnMapping = job.columnMappingJson
          ? (JSON.parse(job.columnMappingJson) as z.infer<typeof columnMappingSchema>)
          : inferColumnMapping(parsed.headers, parsed.previewRows);

        const importResult = await this.deps.importBoqFromExcelUseCase.execute(ctx, {
          batchName: batchNameFromFileName(job.fileName),
          sheetName: parsed.sheetName,
          headers: parsed.headers,
          rows: parsed.allRows,
          columnMapping,
          projectName: campaign.name,
        });

        if (!importResult.ok) {
          throw new Error(importResult.error.message);
        }

        await this.deps.importCampaignRepository.updateJob({
          jobId: job.id,
          status: "imported",
          workshopBatchId: importResult.value.batchId,
          sheetName: parsed.sheetName,
          completedAt: new Date(),
        });
        await this.deps.importCampaignRepository.adjustCampaignCounters(input.campaignId, {
          imported: 1,
        });

        succeededCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Import job failed.";
        await this.deps.importCampaignRepository.updateJob({
          jobId: job.id,
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        });
        await this.deps.importCampaignRepository.adjustCampaignCounters(input.campaignId, {
          failed: 1,
        });
        failedCount += 1;
      }
    }

    const refreshedJobs = await this.deps.importCampaignRepository.listJobsByCampaign(
      input.campaignId,
    );
    const hasPending = refreshedJobs.some((job) => job.status === "pending");
    if (!hasPending) {
      const refreshedCampaign = await this.deps.importCampaignRepository.findById(
        input.campaignId,
      );
      if (refreshedCampaign) {
        await this.deps.importCampaignRepository.updateCampaignStatus(
          input.campaignId,
          refreshedCampaign.failedCount > 0 ? "completed_with_errors" : "completed",
        );
      }
    }

    return ok({ processedCount, succeededCount, failedCount });
  }
}
