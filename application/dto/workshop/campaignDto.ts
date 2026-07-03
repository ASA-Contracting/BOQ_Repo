export type ImportCampaignDto = {
  id: number;
  name: string;
  status: string;
  totalFiles: number;
  importedCount: number;
  aiCompleteCount: number;
  failedCount: number;
};

export type ImportJobDto = {
  id: number;
  fileName: string;
  status: string;
  workshopBatchId: number | null;
  errorMessage: string | null;
};

export type ImportCampaignDetailDto = {
  campaign: ImportCampaignDto;
  jobs: ImportJobDto[];
};
