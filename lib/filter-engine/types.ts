export type FilterType = "text" | "number" | "date" | "select" | "boolean";

export type FilterJoin = "and" | "or";

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "isEmpty"
  | "notEmpty"
  | "globalSearch";

export type FilterValue = string | number | boolean | null | Array<string | number | boolean>;

export type FilterState = {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  joinWithPrev?: FilterJoin;
};

export type SortDirection = "asc" | "desc";

export type SortState = {
  field: string;
  direction: SortDirection;
};

export type FilterRowState = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  joinWithPrev: FilterJoin;
};

export type FilterGroupState = {
  id: string;
  joinWithPrev: FilterJoin;
  rows: FilterRowState[];
};

export type SavedFilterRowState = {
  field: string;
  operator: FilterOperator;
  value: string;
  joinWithPrev: FilterJoin;
};

export type SavedFilterGroupState = {
  joinWithPrev: FilterJoin;
  rows: SavedFilterRowState[];
};

export type SavedFilterDefinition = {
  groups: SavedFilterGroupState[];
  globalSearch?: string;
};

export type SavedFilterItem = {
  id: number;
  pageKey: string;
  name: string;
  definition: SavedFilterDefinition;
  isFavorite: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FilterColumnDef<T> = {
  id: string;
  field: string;
  label: string;
  filterType?: FilterType;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  groupable?: boolean;
  getValue?: (row: T) => unknown;
};
