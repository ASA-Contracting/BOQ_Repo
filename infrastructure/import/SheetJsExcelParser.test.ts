import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { SheetJsExcelParser } from "@/infrastructure/import/SheetJsExcelParser";

function buildWorkbookBuffer(sheets: Record<string, string[][]>): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const [sheetName, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
  }

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

describe("SheetJsExcelParser", () => {
  const parser = new SheetJsExcelParser();

  it("lists all worksheets in the workbook", () => {
    const buffer = buildWorkbookBuffer({
      Summary: [
        ["Name", "Qty"],
        ["Widget", "1"],
      ],
      "Break down (2)": [
        ["BOQ #", "Description"],
        ["1", "Item A"],
      ],
    });

    expect(parser.listSheets(buffer)).toEqual(["Summary", "Break down (2)"]);
  });

  it("parses the requested worksheet by name", () => {
    const buffer = buildWorkbookBuffer({
      Summary: [
        ["Name", "Qty"],
        ["Widget", "1"],
      ],
      "Break down (2)": [
        ["BOQ #", "Description"],
        ["1", "Item A"],
        ["2", "Item B"],
      ],
    });

    const parsed = parser.parse(buffer, "Break down (2)");

    expect(parsed.sheetName).toBe("Break down (2)");
    expect(parsed.sheetNames).toEqual(["Summary", "Break down (2)"]);
    expect(parsed.detectedHeaderRowIndex).toBe(0);
    expect(parsed.headers).toEqual(["BOQ #", "Description"]);
    expect(parsed.totalRowCount).toBe(2);
    expect(parsed.allRows[0]).toEqual(["1", "Item A"]);
  });

  it("defaults to the first worksheet when no sheet is specified", () => {
    const buffer = buildWorkbookBuffer({
      First: [
        ["Code", "Unit"],
        ["A1", "EA"],
      ],
      Second: [
        ["Code", "Unit"],
        ["B1", "M"],
      ],
    });

    const parsed = parser.parse(buffer);

    expect(parsed.sheetName).toBe("First");
    expect(parsed.allRows[0]).toEqual(["A1", "EA"]);
  });
});
