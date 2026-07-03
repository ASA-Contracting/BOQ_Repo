import type { ImportCampaign, ImportJob } from "@/domain/workshop/ImportCampaign";

export type CreateImportCampaignInput = {
  name: string;
  defaultColumnMappingJson: string | null;
  createdBy: string;
};

export type CreateImportJobInput = {
  campaignId: number;
  fileName: string;
  fileContentBase64: string;
  columnMappingJson: string | null;
};

export interface IImportCampaignRepository {
  findById(id: number): Promise<ImportCampaign | null>;
  listRecent(limit: number): Promise<ImportCampaign[]>;
  createCampaign(input: CreateImportCampaignInput): Promise<ImportCampaign>;
  updateCampaignStatus(id: number, status: ImportCampaign["status"]): Promise<void>;
  adjustCampaignCounters(
    id: number,
    delta: {
      totalFiles?: number;
      imported?: number;
      aiComplete?: number;
      failed?: number;
    },
  ): Promise<void>;
  createJobs(jobs: CreateImportJobInput[]): Promise<number[]>;
  listJobsByCampaign(campaignId: number): Promise<ImportJob[]>;
  claimNextPendingJob(campaignId: number): Promise<(ImportJob & { fileContentBase64: string | null }) | null>;
  updateJob(input: {
    jobId: number;
    status: ImportJob["status"];
    workshopBatchId?: number | null;
    errorMessage?: string | null;
    sheetName?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }): Promise<void>;
  getJobFileContent(jobId: number): Promise<string | null>;
}
