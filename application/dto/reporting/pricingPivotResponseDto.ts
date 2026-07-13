import { z } from "zod";

const pivotCellValueSchema = z.object({
  raw: z.number().nullable(),
  formatted: z.string(),
});

export const pivotEngineResultDtoSchema = z.object({
  rowKeys: z.array(z.array(z.string())),
  colKeys: z.array(z.array(z.string())),
  rowLabels: z.array(z.string()),
  colLabels: z.array(z.string()),
  cells: z.array(z.array(pivotCellValueSchema)),
  rowTotals: z.array(pivotCellValueSchema),
  colTotals: z.array(pivotCellValueSchema),
  grandTotal: pivotCellValueSchema,
});

export const pivotSummaryMetricsDtoSchema = z.object({
  averageRate: z.number().nullable(),
  medianRate: z.number().nullable(),
  highestRate: z.number().nullable(),
  lowestRate: z.number().nullable(),
  projectCount: z.number().int().nonnegative(),
  categoryCount: z.number().int().nonnegative(),
  familyCount: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  pricedItemCount: z.number().int().nonnegative(),
});

export const pricingPivotResponseDtoSchema = z.object({
  rowCount: z.number().int().nonnegative(),
  summary: pivotSummaryMetricsDtoSchema.nullable(),
  pivotResult: pivotEngineResultDtoSchema.nullable(),
});

export type PricingPivotResponseDto = z.infer<typeof pricingPivotResponseDtoSchema>;

export const pricingPivotFieldValueOptionDtoSchema = z.object({
  value: z.string(),
  count: z.number().int().nonnegative(),
  excluded: z.boolean(),
});

export const pricingPivotFieldValuesResponseDtoSchema = z.object({
  options: z.array(pricingPivotFieldValueOptionDtoSchema),
});

export type PricingPivotFieldValuesResponseDto = z.infer<
  typeof pricingPivotFieldValuesResponseDtoSchema
>;
