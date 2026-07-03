export type ImportCampaignStatus =
  | "draft"
  | "processing"
  | "completed"
  | "completed_with_errors";

export type ImportCampaign = {
  id: number;
  name: string;
  status: ImportCampaignStatus;
  totalFiles: number;
  importedCount: number;
  aiCompleteCount: number;
  failedCount: number;
  defaultColumnMappingJson: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ImportJobStatus =
  | "pending"
  | "importing"
  | "imported"
  | "ai_running"
  | "ai_done"
  | "failed";

export type ImportJob = {
  id: number;
  campaignId: number;
  fileName: string;
  status: ImportJobStatus;
  workshopBatchId: number | null;
  errorMessage: string | null;
  sheetName: string | null;
  columnMappingJson: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};
