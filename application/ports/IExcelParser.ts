export type ExcelParseResult = {
  sheetName: string;
  sheetNames: string[];
  sheetRows: string[][];
  detectedHeaderRowIndex: number;
  headers: string[];
  rawHeaders: string[];
  columnLetters: string[];
  previewRows: string[][];
  allRows: string[][];
  totalRowCount: number;
  skippedLabelRowCount: number;
};

export interface IExcelParser {
  listSheets(buffer: Buffer): string[];
  parse(buffer: Buffer, sheetName?: string): ExcelParseResult;
}
