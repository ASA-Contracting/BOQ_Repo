import type { BoqBreakdownDto, BoqItemRowDto, BoqListEntryDto } from "@/application/boq/dto";
import type { BoqId } from "@/domain/boq/ids";

export type InsertBoqItemInput = {
  boqId: number;
  versionId: number | null;
  relativeToItemId: number;
  position: "before" | "after";
};

export interface IBoqReadRepository {
  listBoqs(): Promise<BoqListEntryDto[]>;
  getBoqBreakdown(boqId: number): Promise<BoqBreakdownDto | null>;
  countMeasurableItems(boqId: BoqId): Promise<number>;
  updateItemMaterialNodeId(itemId: number, materialNodeId: number | null): Promise<void>;
  insertBoqItem(input: InsertBoqItemInput): Promise<BoqItemRowDto>;
  deleteBoqItem(itemId: number): Promise<void>;
}
