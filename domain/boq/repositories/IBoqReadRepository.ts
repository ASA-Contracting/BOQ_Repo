import type { BoqBreakdownDto, BoqListEntryDto } from '@/application/boq/dto';

export interface IBoqReadRepository {
  listBoqs(): Promise<BoqListEntryDto[]>;
  getBoqBreakdown(boqId: number): Promise<BoqBreakdownDto | null>;
  updateItemMaterialNodeId(itemId: number, materialNodeId: number | null): Promise<void>;
}
