import { describe, expect, it } from "vitest";

import {
  buildColumnMappingByIndex,
  buildMappedPreview,
  columnMappingFromIndex,
  excelColumnTitle,
  fieldAssignments,
} from "@/app/(dashboard)/boq/import/_components/import-wizard-utils";

describe("import-wizard-utils", () => {
  it("prefers raw Excel header text for column title", () => {
    expect(
      excelColumnTitle(["BOQ #", "Item Description"], ["A", "B"], 0),
    ).toBe("BOQ #");
    expect(excelColumnTitle(["", "QTY"], ["A", "D"], 1)).toBe("QTY");
  });

  it("falls back to resolved header sample when header cell is empty", () => {
    expect(excelColumnTitle(["", ""], ["A", "B"], 0, "A · BOQ #")).toBe("BOQ #");
    expect(excelColumnTitle(["", ""], ["C", "D"], 0)).toBe("Column C");
  });

  it("tracks field assignments by column letter", () => {
    expect(
      fieldAssignments({ 0: "item_no", 1: "description", 3: "quantity" }, [
        "A",
        "B",
        "C",
        "D",
      ]),
    ).toEqual(
      new Map([
        ["item_no", "A"],
        ["description", "B"],
        ["quantity", "D"],
      ]),
    );
  });

  it("builds and round-trips index-based column mapping", () => {
    const headers = ["BOQ #", "Item Description", "Unit", "QTY"];
    const byIndex = buildColumnMappingByIndex(headers, {
      "BOQ #": "item_no",
      "Item Description": "description",
      Unit: "unit",
      QTY: "quantity",
    });

    expect(byIndex).toEqual({
      0: "item_no",
      1: "description",
      2: "unit",
      3: "quantity",
    });

    expect(columnMappingFromIndex(headers, byIndex)).toEqual({
      "BOQ #": "item_no",
      "Item Description": "description",
      Unit: "unit",
      QTY: "quantity",
    });
  });

  it("builds preview rows in wizard field order", () => {
    const rows = [
      ["1", "Widget A", "EA", "10", "12.5"],
      ["2", "Widget B", "M", "5", "3.25"],
    ];
    const mapping = {
      0: "item_no",
      1: "description",
      2: "unit",
      3: "quantity",
      4: "unit_price",
    } as const;

    const preview = buildMappedPreview(rows, mapping, 2);

    expect(preview.activeFields).toEqual([
      "item_no",
      "description",
      "unit",
      "quantity",
      "unit_price",
    ]);
    expect(preview.previewRows).toEqual([
      ["1", "Widget A", "EA", "10", "12.5"],
      ["2", "Widget B", "M", "5", "3.25"],
    ]);
  });
});
