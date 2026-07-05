const EXCEL_BOQ_HEADER_LABELS = [
  "description",
  "desc",
  "item description",
  "work item",
  "particulars",
  "unit",
  "uom",
  "measure",
  "quantity",
  "qty",
  "q'ty",
  "amount",
  "unit price",
  "unit rate",
  "rate",
  "price",
  "unit cost",
  "u/p",
  "item no",
  "item no.",
  "item number",
  "boq #",
  "boq",
  "no",
  "no.",
  "item",
  "total sale",
  "total",
  "amount total",
];

export function normalizeExcelLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isNumericCell(value: string): boolean {
  const compact = value.replace(/,/g, "").replace(/\s+/g, "");
  return /^-?\d+(?:\.\d+)?$/.test(compact);
}

export function matchesExcelBoqHeaderLabel(value: string): boolean {
  const normalized = normalizeExcelLabel(value);
  if (!normalized) {
    return false;
  }

  return EXCEL_BOQ_HEADER_LABELS.some(
    (label) => normalized === label || normalized.includes(label),
  );
}

export function cellMatchesHeaderColumn(cell: string, headerCell: string): boolean {
  const normalizedCell = normalizeExcelLabel(cell);
  const normalizedHeader = normalizeExcelLabel(headerCell);

  if (!normalizedCell || !normalizedHeader) {
    return false;
  }

  return (
    normalizedCell === normalizedHeader ||
    normalizedHeader.includes(normalizedCell) ||
    normalizedCell.includes(normalizedHeader)
  );
}

export function countExcelBoqHeaderLabelMatches(row: string[]): number {
  return row.reduce((count, cell) => {
    return matchesExcelBoqHeaderLabel(cell) ? count + 1 : count;
  }, 0);
}

/** Rows that repeat Excel column titles instead of BOQ line data. */
export function isExcelBoqLabelRow(row: string[], headerCells: string[]): boolean {
  const maxColumns = Math.max(row.length, headerCells.length);
  let headerColumnMatches = 0;
  let nonEmptyCells = 0;

  for (let index = 0; index < maxColumns; index += 1) {
    const cell = (row[index] ?? "").trim();
    if (!cell) {
      continue;
    }

    nonEmptyCells += 1;

    if (isNumericCell(cell)) {
      return false;
    }

    const headerCell = headerCells[index] ?? "";
    if (
      matchesExcelBoqHeaderLabel(cell) ||
      cellMatchesHeaderColumn(cell, headerCell)
    ) {
      headerColumnMatches += 1;
    }
  }

  if (nonEmptyCells === 0) {
    return false;
  }

  return headerColumnMatches >= 2 && headerColumnMatches / nonEmptyCells >= 0.6;
}

export function countLeadingExcelLabelRows(
  sheetRows: string[][],
  headerRowIndex: number,
  headerCells: string[],
): number {
  let skipCount = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < sheetRows.length; rowIndex += 1) {
    const row = sheetRows[rowIndex] ?? [];
    if (!row.some((cell) => cell.trim().length > 0)) {
      continue;
    }

    if (!isExcelBoqLabelRow(row, headerCells)) {
      break;
    }

    skipCount += 1;
  }

  return skipCount;
}

export function scoreExcelHeaderRow(row: string[]): number {
  return countExcelBoqHeaderLabelMatches(row);
}
