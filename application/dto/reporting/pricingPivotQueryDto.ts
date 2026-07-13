import { z } from "zod";

const pivotAggregatorIdSchema = z.enum([
  "Average",
  "Sum",
  "Count",
  "Median",
  "Minimum",
  "Maximum",
  "Count Unique Values",
]);

const pivotSortOrderSchema = z.enum([
  "key_a_to_z",
  "key_z_to_a",
  "value_a_to_z",
  "value_z_to_a",
]);

export const pricingPivotQuerySchema = z.object({
  rows: z.array(z.string()),
  cols: z.array(z.string()),
  vals: z.array(z.string()),
  aggregatorName: pivotAggregatorIdSchema,
  valueFilter: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  rowOrder: pivotSortOrderSchema.default("key_a_to_z"),
  colOrder: pivotSortOrderSchema.default("key_a_to_z"),
  gridSearch: z.string().default(""),
});

export type PricingPivotQueryDto = z.infer<typeof pricingPivotQuerySchema>;

export const pricingPivotFieldValuesQuerySchema = z.object({
  field: z.string().min(1),
  valueFilter: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  gridSearch: z.string().default(""),
});

export type PricingPivotFieldValuesQueryDto = z.infer<
  typeof pricingPivotFieldValuesQuerySchema
>;
