import * as XLSX from "xlsx";

import type { ExcelParseResult, IExcelParser } from "@/application/ports/IExcelParser";
import {
  buildExcelImportPreview,
  detectHeaderRowIndex,
} from "@/application/use-cases/workshop/buildExcelImportPreview";

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function readWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: "buffer" });
}

function parseWorksheet(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const sheetRows = rows.map((row) => (Array.isArray(row) ? row.map(cellToString) : []));

  if (sheetRows.length === 0) {
    throw new Error("Excel worksheet is empty.");
  }

  const detectedHeaderRowIndex = detectHeaderRowIndex(sheetRows);
  if (detectedHeaderRowIndex === -1) {
    throw new Error("Excel worksheet has no header row.");
  }

  const preview = buildExcelImportPreview({
    sheetRows,
    headerRowIndex: detectedHeaderRowIndex,
  });

  return {
    sheetRows,
    detectedHeaderRowIndex,
    ...preview,
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
