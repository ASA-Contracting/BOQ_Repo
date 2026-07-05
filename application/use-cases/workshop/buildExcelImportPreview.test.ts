import { describe, expect, it } from "vitest";

import {
  buildExcelImportPreview,
  detectHeaderRowIndex,
} from "@/application/use-cases/workshop/buildExcelImportPreview";
import { isExcelBoqLabelRow } from "@/application/use-cases/workshop/excelHeaderLabels";

describe("excelHeaderLabels", () => {
  const headerCells = ["BOQ #", "Item Description", "Unit", "QTY", "Unit Rate", "Total Sale"];

  it("recognizes a repeated Excel header row like the user example", () => {
    expect(
      isExcelBoqLabelRow(
        ["BOQ #", "Item Description", "Unit", "QTY", "Unit Rate"],
        headerCells,
      ),
    ).toBe(true);
  });

  it("does not treat measurable BOQ rows as label rows", () => {
    expect(
      isExcelBoqLabelRow(["1", "Gate valve", "EA", "10", "25.50", "255"], headerCells),
    ).toBe(false);
  });
});

describe("buildExcelImportPreview", () => {
  const sheetRows = [
    ["Project BOQ Export", "", "", ""],
    ["BOQ #", "Item Description", "Unit", "QTY", "4470431", "Total Sale"],
    ["", "", "", "", "Unit Rate", "Total Sale"],
    ["1", "Gate valve", "EA", "10", "25.50", "255"],
    ["2", "Check valve", "EA", "5", "18", "90"],
  ];

  it("detects the BOQ header row instead of a title row above it", () => {
    expect(detectHeaderRowIndex(sheetRows)).toBe(1);
  });

  it("uses the selected header row for column mapping", () => {
    const preview = buildExcelImportPreview({
      sheetRows,
      headerRowIndex: 1,
    });

    expect(preview.rawHeaders[0]).toBe("BOQ #");
    expect(preview.skippedLabelRowCount).toBe(1);
    expect(preview.totalRowCount).toBe(2);
    expect(preview.allRows[0]?.[1]).toBe("Gate valve");
    expect(preview.allRows[0]?.[4]).toBe("25.50");
  });

  it("skips label rows after the header before importing data", () => {
    const preview = buildExcelImportPreview({
      sheetRows,
      headerRowIndex: 1,
      skipRowsAfterHeader: 1,
    });

    expect(preview.totalRowCount).toBe(2);
    expect(preview.allRows[0]?.[1]).toBe("Gate valve");
    expect(preview.allRows[0]?.[4]).toBe("25.50");
  });

  it("drops a full repeated header row shown in the import preview", () => {
    const repeatedHeaderSheet = [
      ["BOQ #", "Item Description", "Unit", "QTY", "Unit Rate", "Total Sale"],
      ["BOQ #", "Item Description", "Unit", "QTY", "Unit Rate"],
      ["1", "Gate valve", "EA", "10", "25.50", "255"],
    ];

    const preview = buildExcelImportPreview({
      sheetRows: repeatedHeaderSheet,
      headerRowIndex: 0,
    });

    expect(preview.skippedLabelRowCount).toBe(1);
    expect(preview.totalRowCount).toBe(1);
    expect(preview.allRows[0]).toEqual(["1", "Gate valve", "EA", "10", "25.50", "255"]);
  });
});
