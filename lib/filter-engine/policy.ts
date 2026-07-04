import type {
  FilterColumnDef,
  FilterJoin,
  FilterOperator,
  FilterState,
  FilterType,
  FilterValue,
  SortState,
} from "./types";

export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, prop) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[prop];
  }, obj);
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}

export function matchesFilter(
  value: unknown,
  filterValue: FilterValue,
  operator: FilterOperator,
  filterType: FilterType,
): boolean {
  const isEmpty = value === null || value === undefined || value === "";

  if (operator === "isEmpty") {
    return isEmpty;
  }

  if (operator === "notEmpty") {
    return !isEmpty;
  }

  if (filterValue === null || filterValue === undefined || filterValue === "") {
    return true;
  }

  if (isEmpty) {
    return false;
  }

  const valueStr = String(value).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  switch (operator) {
    case "equals":
      return filterType === "number"
        ? Number(value) === Number(filterValue)
        : valueStr === filterStr;
    case "notEquals":
      return filterType === "number"
        ? Number(value) !== Number(filterValue)
        : valueStr !== filterStr;
    case "contains":
    case "globalSearch":
      return valueStr.includes(filterStr);
    case "notContains":
      return !valueStr.includes(filterStr);
    case "startsWith":
      return valueStr.startsWith(filterStr);
    case "endsWith":
      return valueStr.endsWith(filterStr);
    case "greaterThan":
      return Number(value) > Number(filterValue);
    case "lessThan":
      return Number(value) < Number(filterValue);
    case "greaterThanOrEqual":
      return Number(value) >= Number(filterValue);
    case "lessThanOrEqual":
      return Number(value) <= Number(filterValue);
    case "in":
      if (!Array.isArray(filterValue)) return false;
      if (filterType === "number") {
        const numeric = Number(value);
        return Number.isFinite(numeric) && filterValue.some((item) => Number(item) === numeric);
      }
      return filterValue.map(String).includes(String(value));
    case "notIn":
      if (!Array.isArray(filterValue)) return false;
      if (filterType === "number") {
        const numeric = Number(value);
        return !Number.isFinite(numeric) || filterValue.every((item) => Number(item) !== numeric);
      }
      return !filterValue.map(String).includes(String(value));
    default:
      return true;
  }
}

function resolveRowValue<T>(row: T, field: string, column?: FilterColumnDef<T>): unknown {
  if (column?.getValue) {
    return column.getValue(row);
  }
  return getNestedValue(row, field);
}

export function applySorts<T>(data: T[], sorts: SortState[], columns: FilterColumnDef<T>[]): T[] {
  if (sorts.length === 0) {
    return data;
  }

  const columnByField = new Map(columns.map((column) => [column.field, column]));

  return [...data].sort((left, right) => {
    for (const sort of sorts) {
      const column = columnByField.get(sort.field);
      const comparison = compareValues(
        resolveRowValue(left, sort.field, column),
        resolveRowValue(right, sort.field, column),
      );
      if (comparison !== 0) {
        return sort.direction === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
}

export function applyFilters<T>(
  data: T[],
  filters: FilterState[],
  columns: FilterColumnDef<T>[],
): T[] {
  if (filters.length === 0) {
    return data;
  }

  const columnByField = new Map(columns.map((column) => [column.field, column]));
  const globalSearchFilters = filters.filter((filter) => filter.operator === "globalSearch");
  const regularFilters = filters.filter((filter) => filter.operator !== "globalSearch");

  return data.filter((row) => {
    const matchesRegular =
      regularFilters.length === 0
        ? true
        : regularFilters.reduce<boolean>((acc, filter, index) => {
            const column = columnByField.get(filter.field);
            const filterType = column?.filterType ?? "text";
            const value = resolveRowValue(row, filter.field, column);
            const currentMatch = matchesFilter(
              value,
              filter.value,
              filter.operator,
              filterType,
            );

            if (index === 0) {
              return currentMatch;
            }

            return filter.joinWithPrev === "or" ? acc || currentMatch : acc && currentMatch;
          }, true);

    if (!matchesRegular) {
      return false;
    }

    if (globalSearchFilters.length === 0) {
      return true;
    }

    return globalSearchFilters.some((filter) => {
      const column = columnByField.get(filter.field);
      const filterType = column?.filterType ?? "text";
      const value = resolveRowValue(row, filter.field, column);
      return matchesFilter(value, filter.value, "contains", filterType);
    });
  });
}

export function buildGlobalSearchFilters<T>(
  term: string,
  columns: FilterColumnDef<T>[],
): FilterState[] {
  const normalized = term.trim();
  if (!normalized) {
    return [];
  }

  return columns
    .filter((column) => column.searchable !== false && column.filterable !== false)
    .map((column) => ({
      field: column.field,
      operator: "globalSearch" as FilterOperator,
      value: normalized,
    }));
}

export function buildColumnFilterState(
  field: string,
  operator: FilterOperator,
  value: FilterValue,
): FilterState {
  return { field, operator, value };
}

export function upsertColumnFilterState(
  states: readonly FilterState[],
  next: FilterState,
): FilterState[] {
  return [...states.filter((state) => state.field !== next.field || state.operator === "globalSearch"), next];
}

export function removeColumnFilterState(states: readonly FilterState[], field: string): FilterState[] {
  return states.filter((state) => state.field !== field || state.operator === "globalSearch");
}

export function operatorNeedsNoValue(operator: FilterOperator): boolean {
  return operator === "isEmpty" || operator === "notEmpty";
}

export function getDistinctValues<T>(
  data: T[],
  field: string,
  column?: FilterColumnDef<T>,
): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const row of data) {
    const raw = resolveRowValue(row, field, column);
    if (raw === null || raw === undefined || raw === "") {
      continue;
    }
    const label = String(raw).trim();
    if (!label || seen.has(label)) {
      continue;
    }
    seen.add(label);
    values.push(label);
  }

  return values.sort((a, b) => a.localeCompare(b));
}

export function createFilterRowId(): string {
  return `filter-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFilterGroupId(): string {
  return `group-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultJoinForIndex(index: number): FilterJoin {
  return index === 0 ? "and" : "and";
}
