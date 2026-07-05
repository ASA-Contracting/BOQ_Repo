export type WorkshopBatchSummaryDto = {
  id: number;
  name: string;
  status: string;
  workflowStage: string;
  importItemCount: number;
  itemsApprovedCount: number;
  itemsPendingReviewCount: number;
  latestAiAnalysisId: number | null;
  linkedBoqVersionId: number | null;
  versionName: string | null;
  versionNumber: number | null;
  approvalStatus: string | null;
  returnToEngineerNotes: string | null;
};

export type CategorizationBatchContextDto = {
  batch: WorkshopBatchSummaryDto;
  reviewedCount: number;
  totalCount: number;
  hasAiRun: boolean;
};

export type FamilyPathDto = {
  id: number;
  name: string;
  path: string;
};

export type AiSuggestionDto = {
  id: number;
  familyId: number | null;
  familyPath: string | null;
  confidence: number | null;
  rationale: string | null;
  alternativeFamilyIds: number[];
  runNumber: number;
};

export type SimilarWorkshopItemDto = {
  id: number;
  description: string | null;
  finalFamilyId: number | null;
  finalFamilyPath: string | null;
};

export type PriorDecisionDto = {
  id: number;
  selectedFamilyId: number | null;
  selectedFamilyName: string | null;
  userDisplayName: string | null;
  createdAt: string;
  itemDescription: string | null;
};

export type WorkshopItemReviewDto = {
  id: number;
  batchId: number;
  rowIndex: number;
  description: string | null;
  originalText: string | null;
  unit: string | null;
  quantity: string | null;
  section: string | null;
  discipline: string | null;
  existingMappingPath: string | null;
  finalFamilyId: number | null;
  finalFamilyPath: string | null;
  reviewStatus: string;
  aiSuggestions: AiSuggestionDto[];
  similarItems: SimilarWorkshopItemDto[];
  priorDecisions: PriorDecisionDto[];
};

export type ExcelPreviewDto = {
  sheetName: string;
  sheetNames: string[];
  sheetRows: string[][];
  detectedHeaderRowIndex: number;
  headers: string[];
  rawHeaders: string[];
  columnLetters: string[];
  previewRows: string[][];
  allRows: string[][];
  totalRowCount: number;
  skippedLabelRowCount: number;
};

export type ImportBoqResultDto = {
  batchId: number;
  boqId: number;
  projectId: number;
  itemCount: number;
};
