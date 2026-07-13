export type BoqWorkflowStatus = "complete" | "in_progress" | "empty";

export type BoqListEntryDto = {
  id: number;
  boqId: number;
  batchId: number | null;
  name: string;
  projectId: number;
  projectName: string;
  /** Group key: project + BOQ name so all versions list together. */
  scopeLabel: string;
  discipline: string | null;
  abrdProjectId: number | null;
  externalSource: string;
  client: string | null;
  versionId: number;
  versionName: string | null;
  versionNumber: number | null;
  approvalStatus: string | null;
  workflowStage: string | null;
  itemCount: number;
  measurableCount: number;
  categorizedCount: number;
  pendingCount: number;
  status: BoqWorkflowStatus;
  importedAt: string | null;
  importedById: string | null;
  importedByName: string | null;
  updatedAt: string | null;
};

export type ListBoqsInput = {
  page?: number;
  pageSize?: number;
};

export type ListBoqsPageDto = {
  items: BoqListEntryDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type BoqItemRowDto = {
  id: number;
  rowIndex: number;
  /** Immutable import line number; null for rows added after initial import. */
  masterNo: number | null;
  itemNo: string | null;
  description: string | null;
  unit: string | null;
  quantity: string | null;
  rate: string | null;
  total: string | null;
  isHeader: boolean;
  isMeasurable: boolean;
  materialNodeId: number | null;
  categoryLabel: string | null;
  categoryPath: string | null;
  /** Category-tree parent label shown on the BOQ section header row above categorized children. */
  sectionParentLabel: string | null;
};

export type UpdateBoqItemCategoryDto = {
  itemId: number;
  materialNodeId: number | null;
};

export type BoqVersionSummaryDto = {
  id: number;
  versionNumber: number | null;
  versionName: string | null;
  approvalStatus: string;
  createdAt: string | null;
  isCurrent: boolean;
};

export type BoqBreakdownDto = {
  id: number;
  name: string;
  projectId: number;
  projectName: string;
  discipline: string | null;
  versionId: number | null;
  versionNumber: number | null;
  versionName: string | null;
  batchId: number | null;
  workflowStage: string | null;
  approvalStatus: string | null;
  isApproved: boolean;
  items: BoqItemRowDto[];
  hasMoreItems?: boolean;
  nextCursor?: string | null;
};

export type BoqBreakdownItemsPageDto = {
  items: BoqItemRowDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type ListBoqBreakdownItemsInput = {
  boqId: number;
  versionId?: number;
  page?: number;
  pageSize?: number;
};

export type GetBoqBreakdownInput = {
  boqId: number;
  versionId?: number;
};

export type ListBoqVersionsInput = {
  boqId: number;
  currentVersionId?: number;
};

export type ApproveBoqVersionFromBreakdownInput = {
  boqId: number;
  versionId: number;
};

export type ApproveBoqVersionFromBreakdownResult = {
  versionId: number;
  versionNumber: number;
  versionName: string;
};

export type DuplicateBoqVersionInput = {
  boqId: number;
  sourceVersionId: number;
};

export type DuplicateBoqVersionResult = {
  versionId: number;
  boqId: number;
};
