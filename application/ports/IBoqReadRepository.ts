import type { BoqBreakdownDto, BoqItemRowDto, BoqListEntryDto, BoqVersionSummaryDto } from "@/application/boq/dto";
import type { BoqId } from "@/domain/boq/ids";

export type InsertBoqItemInput = {
  boqId: number;
  versionId: number | null;
  relativeToItemId: number;
  position: "before" | "after";
};

export interface IBoqReadRepository {
  listBoqs(): Promise<BoqListEntryDto[]>;
  getBoqBreakdown(boqId: number, versionId?: number): Promise<BoqBreakdownDto | null>;
  listBoqVersions(boqId: number, currentVersionId?: number | null): Promise<BoqVersionSummaryDto[]>;
  countMeasurableItems(boqId: BoqId): Promise<number>;
  countPendingCategorization(boqId: BoqId): Promise<number>;
  updateItemMaterialNodeId(itemId: number, materialNodeId: number | null): Promise<void>;
  insertBoqItem(input: InsertBoqItemInput): Promise<BoqItemRowDto>;
  deleteBoqItem(itemId: number): Promise<void>;
  softDeleteBoqVersions(versionIds: number[]): Promise<number>;
  updateBatchDiscipline(batchId: number, discipline: string): Promise<void>;
  updateVersionDiscipline(versionId: number, discipline: string): Promise<void>;
  batchBelongsToBoq(boqId: number, batchId: number): Promise<boolean>;
  versionBelongsToBoq(boqId: number, versionId: number): Promise<boolean>;
  isBatchOnApprovedVersion(batchId: number): Promise<boolean>;
  isVersionApproved(versionId: number): Promise<boolean>;
}
