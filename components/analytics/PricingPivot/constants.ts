import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  CircleCheck,
  FileSpreadsheet,
  FolderKanban,
  FolderTree,
  GitBranch,
  Globe,
  HardHat,
  Hash,
  Layers,
  Maximize2,
  Minimize2,
  Ruler,
  Sigma,
  Tags,
} from "lucide-react";

import type { PivotAggregatorId } from "@/lib/analytics/pivot-engine/types";
import { getPivotField } from "@/lib/analytics/pivot-engine/field-catalog";

export const PIVOT_ICON_MAP: Record<string, LucideIcon> = {
  "folder-kanban": FolderKanban,
  "file-spreadsheet": FileSpreadsheet,
  "git-branch": GitBranch,
  "building-2": Building2,
  "badge-check": BadgeCheck,
  globe: Globe,
  "folder-tree": FolderTree,
  tags: Tags,
  layers: Layers,
  "circle-check": CircleCheck,
  banknote: Banknote,
  hash: Hash,
  calculator: Calculator,
  ruler: Ruler,
  "hard-hat": HardHat,
  "align-left": AlignLeft,
};

export const PIVOT_AGGREGATOR_OPTIONS: Array<{
  id: PivotAggregatorId;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "Average", label: "Average", description: "Mean of numeric values", icon: Sigma },
  { id: "Sum", label: "Sum", description: "Total of numeric values", icon: Calculator },
  { id: "Count", label: "Count", description: "Number of records", icon: Hash },
  { id: "Median", label: "Median", description: "Middle value", icon: AlignLeft },
  { id: "Minimum", label: "Minimum", description: "Lowest value", icon: Minimize2 },
  { id: "Maximum", label: "Maximum", description: "Highest value", icon: Maximize2 },
  {
    id: "Count Unique Values",
    label: "Distinct count",
    description: "Unique value count",
    icon: Tags,
  },
];

export const DEFAULT_PIVOT_WORKSPACE = {
  rows: ["Project", "Country"],
  cols: ["Family"],
  vals: ["Unit rate"],
  aggregatorName: "Average" as PivotAggregatorId,
  valueFilter: {},
  rowOrder: "key_a_to_z" as const,
  colOrder: "key_a_to_z" as const,
};

export function formatValueFieldLabel(
  fieldId: string,
  aggregatorName: PivotAggregatorId,
): string {
  if (fieldId === "Unit rate" && aggregatorName === "Average") {
    return "Average Unit Rate";
  }
  const field = getPivotField(fieldId);
  const label = field?.label ?? fieldId;
  if (aggregatorName === "Average") return `Average ${label}`;
  if (aggregatorName === "Sum") return `Sum of ${label}`;
  if (aggregatorName === "Count") return `Count of ${label}`;
  return label;
}

export const SAVED_VIEWS_STORAGE_KEY = "boq.pricing-pivot.saved-views.v1";

export const DROP_ZONE_META = {
  rows: {
    title: "Rows",
    description: "Group vertically",
    className: "pi-dropzone--rows",
    chipClassName: "pi-chip--rows",
  },
  cols: {
    title: "Columns",
    description: "Spread horizontally",
    className: "pi-dropzone--cols",
    chipClassName: "pi-chip--cols",
  },
  vals: {
    title: "Values",
    description: "Measure to aggregate",
    className: "pi-dropzone--vals",
    chipClassName: "pi-chip--vals",
  },
  filters: {
    title: "Filters",
    description: "Active value filters",
    className: "pi-dropzone--filters",
    chipClassName: "pi-chip--filters",
  },
} as const;

export type DropZoneId = keyof typeof DROP_ZONE_META;
