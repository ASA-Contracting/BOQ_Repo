import type { PricingPivotQueryDto } from "@/application/dto/reporting/pricingPivotQueryDto";
import type { PricingPivotResponseDto } from "@/application/dto/reporting/pricingPivotResponseDto";
import type { PricingPivotDataset } from "@/domain/reporting/PricingPivotRow";
import {
  computePivotResult,
  computeSummaryMetrics,
  filterRecordsBySearch,
  getFieldValueOptions,
} from "@/lib/analytics/pivot-engine";
import { toPivotRecords } from "@/lib/analytics/pivot-engine/to-pivot-records";
import type { FieldValueOption } from "@/lib/analytics/pivot-engine/field-values";

export function buildVisiblePivotRecords(
  dataset: PricingPivotDataset,
  query: Pick<PricingPivotQueryDto, "gridSearch">,
) {
  const records = toPivotRecords(dataset.rows);
  return filterRecordsBySearch(records, query.gridSearch);
}

export function computePricingPivotResponse(
  dataset: PricingPivotDataset,
  query: PricingPivotQueryDto,
): PricingPivotResponseDto {
  const visibleData = buildVisiblePivotRecords(dataset, query);

  if (dataset.rowCount === 0 || visibleData.length === 0) {
    return {
      rowCount: dataset.rowCount,
      summary: null,
      pivotResult: null,
    };
  }

  const summary = computeSummaryMetrics(visibleData);

  let pivotResult = null;
  if (query.vals.length > 0) {
    try {
      pivotResult = computePivotResult({
        data: visibleData,
        rows: query.rows,
        cols: query.cols,
        vals: query.vals,
        aggregatorName: query.aggregatorName,
        valueFilter: query.valueFilter,
        rowOrder: query.rowOrder,
        colOrder: query.colOrder,
      });
    } catch (error) {
      console.error("Server pivot computation failed:", error);
    }
  }

  return {
    rowCount: dataset.rowCount,
    summary,
    pivotResult,
  };
}

export function computePricingPivotFieldValues(
  dataset: PricingPivotDataset,
  field: string,
  valueFilter: PricingPivotQueryDto["valueFilter"],
  gridSearch: string,
): FieldValueOption[] {
  const visibleData = buildVisiblePivotRecords(dataset, { gridSearch });
  return getFieldValueOptions(visibleData, field, valueFilter);
}
