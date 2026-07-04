import type { FilterOperator, FilterType } from "./types";
import { operatorNeedsNoValue } from "./policy";

export type OperatorOption = {
  value: FilterOperator;
  label: string;
};

const TEXT_OPERATORS: OperatorOption[] = [
  { value: "contains", label: "contains" },
  { value: "notContains", label: "does not contain" },
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "startsWith", label: "starts with" },
  { value: "endsWith", label: "ends with" },
  { value: "isEmpty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
];

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "greaterThan", label: "is greater than" },
  { value: "greaterThanOrEqual", label: "is greater or equal" },
  { value: "lessThan", label: "is less than" },
  { value: "lessThanOrEqual", label: "is less or equal" },
  { value: "isEmpty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
];

const SELECT_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "in", label: "is one of" },
  { value: "notIn", label: "is not one of" },
  { value: "isEmpty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
];

const BOOLEAN_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Does not equal" },
];

export function getOperatorOptions(filterType: FilterType = "text"): OperatorOption[] {
  switch (filterType) {
    case "number":
      return NUMBER_OPERATORS;
    case "select":
    case "boolean":
      return filterType === "boolean" ? BOOLEAN_OPERATORS : SELECT_OPERATORS;
    case "date":
      return NUMBER_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

export function getDefaultOperator(filterType: FilterType = "text"): FilterOperator {
  if (filterType === "number" || filterType === "date") {
    return "equals";
  }
  return "contains";
}

export function isFilterComplete(
  field: string,
  operator: FilterOperator,
  value: string,
): boolean {
  if (!field.trim() || !operator) {
    return false;
  }
  if (operatorNeedsNoValue(operator)) {
    return true;
  }
  if (operator === "in" || operator === "notIn") {
    return value.trim().length > 0;
  }
  return value.trim().length > 0;
}

export function operatorLabel(operator: FilterOperator): string {
  const all = [...TEXT_OPERATORS, ...NUMBER_OPERATORS, ...SELECT_OPERATORS, ...BOOLEAN_OPERATORS];
  return all.find((option) => option.value === operator)?.label ?? operator;
}

const FREE_TEXT_VALUE_OPERATORS = new Set<FilterOperator>([
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
]);

export function operatorUsesFreeTextValue(operator: FilterOperator): boolean {
  return FREE_TEXT_VALUE_OPERATORS.has(operator);
}

export function valueUsesDropdown(filterType: FilterType, operator: FilterOperator): boolean {
  if (operatorUsesFreeTextValue(operator)) {
    return false;
  }
  return filterType === "select" || filterType === "boolean";
}

export function filterValuePlaceholder(
  filterType: FilterType,
  operator: FilterOperator,
  hasField: boolean,
): string {
  if (!hasField) return "Value";
  if (operatorNeedsNoValue(operator)) return "No value needed";
  if (filterType === "date") return "Select date";
  if (filterType === "number") return "Enter number";
  if (operatorUsesFreeTextValue(operator)) return "Type partial value";
  return "Enter value";
}
