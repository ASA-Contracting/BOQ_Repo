import type { PricingPivotDataset } from "@/domain/reporting/PricingPivotRow";

export interface IPricingPivotRepository {
  listPricingPivotRows(): Promise<PricingPivotDataset>;
}
