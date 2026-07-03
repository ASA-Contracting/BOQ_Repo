import type { BoqId, BoqItemId, BoqVersionId, ProjectId } from "@/domain/boq/ids";

export type ImportBoqLineInput = {
  rowIndex: number;
  description: string | null;
  unit: string | null;
  quantity: string | null;
  itemNo: string | null;
  isHeader: boolean;
  isMeasurable: boolean;
  contextSnapshot: Record<string, string> | null;
  originalFamilyId?: number | null;
};

export type ImportBoqSnapshotResult = {
  projectId: ProjectId;
  boqId: BoqId;
  boqVersionId: BoqVersionId;
  items: Array<{
    id: BoqItemId;
    rowIndex: number;
    description: string | null;
    unit: string | null;
    quantity: string | null;
    itemNo: string | null;
    isHeader: boolean;
    isMeasurable: boolean;
    contextSnapshot: Record<string, string> | null;
  }>;
};

export interface IBoqImportRepository {
  createImportSnapshot(input: {
    projectName: string;
    boqName: string;
    createdBy: string;
    lines: ImportBoqLineInput[];
    projectId?: number;
    boqId?: number;
    abrdProjectId?: number;
    externalSource?: "abrd" | "local";
    client?: string;
  }): Promise<ImportBoqSnapshotResult>;
}
