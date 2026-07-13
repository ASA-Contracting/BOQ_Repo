import { z } from "zod";

export const pricingPivotRowDtoSchema = z.object({
  projectName: z.string(),
  country: z.string(),
  client: z.string(),
  tenderStatus: z.string(),
  boqName: z.string(),
  discipline: z.string(),
  versionName: z.string(),
  categoryPath: z.string(),
  categoryLabel: z.string(),
  familyName: z.string(),
  classificationStatus: z.enum(["Categorized", "Uncategorized"]),
  unit: z.string(),
  quantity: z.number().nullable(),
  unitRate: z.number().nullable(),
  totalSale: z.number().nullable(),
  description: z.string(),
});

export type PricingPivotRowDto = z.infer<typeof pricingPivotRowDtoSchema>;

export const pricingPivotDatasetDtoSchema = z.object({
  rows: z.array(pricingPivotRowDtoSchema),
  rowCount: z.number().int().nonnegative(),
});

export type PricingPivotDatasetDto = z.infer<typeof pricingPivotDatasetDtoSchema>;
