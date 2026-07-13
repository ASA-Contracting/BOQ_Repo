/** Flat row for pricing/category pivot analysis — read-only reporting. */

export type PricingPivotRow = {
  projectName: string;
  country: string;
  client: string;
  tenderStatus: string;
  boqName: string;
  discipline: string;
  versionName: string;
  categoryPath: string;
  categoryLabel: string;
  familyName: string;
  classificationStatus: "Categorized" | "Uncategorized";
  unit: string;
  quantity: number | null;
  unitRate: number | null;
  totalSale: number | null;
  description: string;
};

export type PricingPivotDataset = {
  rows: PricingPivotRow[];
  rowCount: number;
};
