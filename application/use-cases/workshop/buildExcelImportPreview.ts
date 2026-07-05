import {
  countLeadingExcelLabelRows,
  isExcelBoqLabelRow,
  scoreExcelHeaderRow,
} from "@/application/use-cases/workshop/excelHeaderLabels";

export type BuildExcelImportPreviewInput = {
  sheetRows: string[][];
  headerRowIndex: number;
  skipRowsAfterHeader?: number;
};

export type ExcelImportPreview = {
  headers: string[];
  rawHeaders: string[];
  columnLetters: string[];
  previewRows: string[][];
  allRows: string[][];
  totalRowCount: number;
  skippedLabelRowCount: number;
};

function excelColumnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function resolveHeaderLabel(
  rawHeader: string,
  columnIndex: number,
  dataRows: string[][],
): string {
  if (rawHeader.length > 0) {
    return rawHeader;
  }

  const sample = dataRows.find((row) => (row[columnIndex] ?? "").length > 0)?.[columnIndex] ?? "";
  const letter = excelColumnLetter(columnIndex);
  if (sample) {
    const clipped = sample.length > 40 ? `${sample.slice(0, 40)}…` : sample;
    return `${letter} · ${clipped}`;
  }

  return `Column ${letter}`;
}

export function detectHeaderRowIndex(sheetRows: string[][]): number {
  let bestIndex = -1;
  let bestScore = 0;

  const scanLimit = Math.min(sheetRows.length, 25);
  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const score = scoreExcelHeaderRow(sheetRows[rowIndex] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = rowIndex;
    }
  }

  if (bestIndex >= 0 && bestScore >= 2) {
    return bestIndex;
  }

  return sheetRows.findIndex((row) => row.some((cell) => cell.trim().length > 0));
}

export function buildExcelImportPreview(
  input: BuildExcelImportPreviewInput,
): ExcelImportPreview {
  const { sheetRows, headerRowIndex, skipRowsAfterHeader = 0 } = input;

  if (headerRowIndex < 0 || headerRowIndex >= sheetRows.length) {
    throw new Error("Header row is outside the worksheet.");
  }

  const headerCells = sheetRows[headerRowIndex].map((cell) => cell.trim());
  if (!headerCells.some((cell) => cell.length > 0)) {
    throw new Error("Selected header row is empty.");
  }

  const autoSkippedLabelRows = countLeadingExcelLabelRows(
    sheetRows,
    headerRowIndex,
    headerCells,
  );
  const skippedLabelRowCount = Math.max(skipRowsAfterHeader, autoSkippedLabelRows);
  const dataStartIndex = headerRowIndex + 1 + skippedLabelRowCount;
  const dataRows = sheetRows
    .slice(dataStartIndex)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .filter((row) => !isExcelBoqLabelRow(row, headerCells))
    .map((row) => {
      const normalized = row.map((cell) => cell.trim());
      while (normalized.length < headerCells.length) {
        normalized.push("");
      }
      return normalized.slice(0, headerCells.length);
    });

  const headers = headerCells.map((header, index) =>
    resolveHeaderLabel(header, index, dataRows),
  );
  const columnLetters = headerCells.map((_, index) => excelColumnLetter(index));

  return {
    headers,
    rawHeaders: headerCells,
    columnLetters,
    previewRows: dataRows.slice(0, 10),
    allRows: dataRows,
    totalRowCount: dataRows.length,
    skippedLabelRowCount,
  };
}

export function summarizeSheetRow(row: string[], maxCells = 4): string {
  const cells = row
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .slice(0, maxCells);

  if (cells.length === 0) {
    return "(empty row)";
  }

  const summary = cells.join(" · ");
  return summary.length > 72 ? `${summary.slice(0, 72)}…` : summary;
}
