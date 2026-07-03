import * as XLSX from "xlsx";

import type { ExcelParseResult, IExcelParser } from "@/application/ports/IExcelParser";

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

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

function readWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: "buffer" });
}

function parseWorksheet(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const stringRows = rows.map((row) => (Array.isArray(row) ? row.map(cellToString) : []));

  const headerRowIndex = stringRows.findIndex((row) => row.some((cell) => cell.length > 0));

  if (headerRowIndex === -1) {
    throw new Error("Excel worksheet has no header row.");
  }

  const headerCells = stringRows[headerRowIndex].map(cellToString);

  const dataRows = stringRows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.length > 0))
    .map((row) => {
      const normalized = row.map(cellToString);
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
  };
}

export class SheetJsExcelParser implements IExcelParser {
  listSheets(buffer: Buffer): string[] {
    const workbook = readWorkbook(buffer);
    return workbook.SheetNames;
  }

  parse(buffer: Buffer, sheetName?: string): ExcelParseResult {
    const workbook = readWorkbook(buffer);
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      throw new Error("Excel file has no worksheets.");
    }

    if (sheetName && !sheetNames.includes(sheetName)) {
      throw new Error(`Worksheet "${sheetName}" was not found in this file.`);
    }

    const resolvedSheetName = sheetName ?? sheetNames[0];
    const sheet = workbook.Sheets[resolvedSheetName];

    if (!sheet) {
      throw new Error(`Worksheet "${resolvedSheetName}" could not be read.`);
    }

    return {
      sheetName: resolvedSheetName,
      sheetNames,
      ...parseWorksheet(sheet),
    };
  }
}
