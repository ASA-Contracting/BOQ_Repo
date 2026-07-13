import type { PricingPivotRowDto } from "@/application/dto/reporting/pricingPivotDto";
import type {
  PricingPivotDataset,
  PricingPivotRow,
} from "@/domain/reporting/PricingPivotRow";

function toPricingPivotRowDto(row: PricingPivotRow): PricingPivotRowDto {
  return {
    projectName: row.projectName,
    country: row.country,
    client: row.client,
    tenderStatus: row.tenderStatus,
    boqName: row.boqName,
    discipline: row.discipline,
    versionName: row.versionName,
    categoryPath: row.categoryPath,
    categoryLabel: row.categoryLabel,
    familyName: row.familyName,
    classificationStatus: row.classificationStatus,
    unit: row.unit,
    quantity: row.quantity,
    unitRate: row.unitRate,
    totalSale: row.totalSale,
    description: row.description,
  };
}

export function toPricingPivotDatasetDto(
  dataset: PricingPivotDataset,
): { rows: PricingPivotRowDto[]; rowCount: number } {
  return {
    rows: dataset.rows.map(toPricingPivotRowDto),
    rowCount: dataset.rowCount,
  };
}
