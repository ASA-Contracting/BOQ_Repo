/** Pivot engine types — no UI dependencies. */

export type PivotRecord = Record<string, string | number>;

export type PivotAggregatorId =
  | "Average"
  | "Sum"
  | "Count"
  | "Median"
  | "Minimum"
  | "Maximum"
  | "Count Unique Values";

export type PivotSortOrder = "key_a_to_z" | "key_z_to_a" | "value_a_to_z" | "value_z_to_a";

/** react-pivottable excludes values listed in valueFilter[field][value] */
export type PivotValueFilter = Record<string, Record<string, boolean>>;

export type PivotEngineConfig = {
  data: PivotRecord[];
  rows: string[];
  cols: string[];
  vals: string[];
  aggregatorName: PivotAggregatorId;
  valueFilter?: PivotValueFilter;
  rowOrder?: PivotSortOrder;
  colOrder?: PivotSortOrder;
};

export type PivotCellValue = {
  raw: number | null;
  formatted: string;
};

export type PivotEngineResult = {
  rowKeys: string[][];
  colKeys: string[][];
  rowLabels: string[];
  colLabels: string[];
  cells: PivotCellValue[][];
  rowTotals: PivotCellValue[];
  colTotals: PivotCellValue[];
  grandTotal: PivotCellValue;
};

export type PivotSummaryMetrics = {
  averageRate: number | null;
  medianRate: number | null;
  highestRate: number | null;
  lowestRate: number | null;
  projectCount: number;
  categoryCount: number;
  familyCount: number;
  itemCount: number;
  pricedItemCount: number;
};

export type PivotFieldCategoryId =
  | "project"
  | "commercial"
  | "location"
  | "classification"
  | "pricing"
  | "engineering";

export type PivotFieldDefinition = {
  id: string;
  label: string;
  description: string;
  category: PivotFieldCategoryId;
  icon: string;
  numeric?: boolean;
};

export type PivotSavedView = {
  id: string;
  name: string;
  rows: string[];
  cols: string[];
  vals: string[];
  aggregatorName: PivotAggregatorId;
  valueFilter: PivotValueFilter;
  rowOrder: PivotSortOrder;
  colOrder: PivotSortOrder;
  createdAt: string;
};
