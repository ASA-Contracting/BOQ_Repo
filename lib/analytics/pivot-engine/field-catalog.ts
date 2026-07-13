import type { PivotFieldCategoryId, PivotFieldDefinition } from "@/lib/analytics/pivot-engine/types";

export const PIVOT_FIELD_CATEGORIES: Array<{
  id: PivotFieldCategoryId;
  label: string;
  description: string;
}> = [
  { id: "project", label: "Project", description: "Project and BOQ context" },
  { id: "commercial", label: "Commercial", description: "Client and tender metadata" },
  { id: "location", label: "Location", description: "Geography and market" },
  {
    id: "classification",
    label: "Classification",
    description: "Categories, families, and assignment status",
  },
  { id: "pricing", label: "Pricing", description: "Rates, quantities, and totals" },
  { id: "engineering", label: "Engineering", description: "Discipline and line detail" },
];

export const PRICING_PIVOT_FIELDS: PivotFieldDefinition[] = [
  {
    id: "Project",
    label: "Project",
    description: "The project name",
    category: "project",
    icon: "folder-kanban",
  },
  {
    id: "BOQ",
    label: "BOQ",
    description: "Bill of quantities name",
    category: "project",
    icon: "file-spreadsheet",
  },
  {
    id: "Version",
    label: "Version",
    description: "Latest BOQ version label",
    category: "project",
    icon: "git-branch",
  },
  {
    id: "Client",
    label: "Client",
    description: "The client organization",
    category: "commercial",
    icon: "building-2",
  },
  {
    id: "Tender status",
    label: "Tender status",
    description: "Current tender lifecycle stage",
    category: "commercial",
    icon: "badge-check",
  },
  {
    id: "Country",
    label: "Country",
    description: "Project country or region",
    category: "location",
    icon: "globe",
  },
  {
    id: "Category path",
    label: "Category path",
    description: "Full classification hierarchy",
    category: "classification",
    icon: "folder-tree",
  },
  {
    id: "Category",
    label: "Category",
    description: "Assigned material category",
    category: "classification",
    icon: "tags",
  },
  {
    id: "Family",
    label: "Family",
    description: "The approved family",
    category: "classification",
    icon: "layers",
  },
  {
    id: "Classification",
    label: "Classification",
    description: "Categorized or uncategorized status",
    category: "classification",
    icon: "circle-check",
  },
  {
    id: "Unit rate",
    label: "Unit rate",
    description: "Average unit price for aggregation",
    category: "pricing",
    icon: "banknote",
    numeric: true,
  },
  {
    id: "Quantity",
    label: "Quantity",
    description: "Measured quantity",
    category: "pricing",
    icon: "hash",
    numeric: true,
  },
  {
    id: "Total sale",
    label: "Total sale",
    description: "Extended line total",
    category: "pricing",
    icon: "calculator",
    numeric: true,
  },
  {
    id: "Unit",
    label: "Unit",
    description: "Unit of measure",
    category: "pricing",
    icon: "ruler",
  },
  {
    id: "Discipline",
    label: "Discipline",
    description: "Engineering discipline",
    category: "engineering",
    icon: "hard-hat",
  },
  {
    id: "Description",
    label: "Description",
    description: "Line item description",
    category: "engineering",
    icon: "align-left",
  },
];

const fieldById = new Map(PRICING_PIVOT_FIELDS.map((field) => [field.id, field]));

export function getPivotField(id: string): PivotFieldDefinition | undefined {
  return fieldById.get(id);
}

export function fieldsByCategory(category: PivotFieldCategoryId): PivotFieldDefinition[] {
  return PRICING_PIVOT_FIELDS.filter((field) => field.category === category);
}
