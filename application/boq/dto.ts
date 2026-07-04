export type BoqWorkflowStatus = "complete" | "in_progress" | "empty";

export type BoqListEntryDto = {
  id: number;
  boqId: number;
  batchId: number | null;
  name: string;
  projectId: number;
  projectName: string;
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

export type BoqBreakdownDto = {
  id: number;
  name: string;
  projectId: number;
  projectName: string;
  discipline: string | null;
  versionId: number | null;
  versionName: string | null;
  batchId: number | null;
  workflowStage: string | null;
  approvalStatus: string | null;
  items: BoqItemRowDto[];
};

export type GetBoqBreakdownInput = {
  boqId: number;
};
