import { describe, expect, it } from "vitest";

import {
  countMeasurableImportRows,
  mapImportRows,
} from "@/application/use-cases/workshop/mapImportRows";

describe("mapImportRows", () => {
  const baseInput = {
    batchName: "Test BOQ",
    sheetName: "Sheet1",
    headers: ["A · BOQ #", "B · Item Description", "C · Unit", "D · QTY"],
    rows: [
      ["", "Section 15520 - (Valves)", "", ""],
      ["1", "Gate valve 2in", "EA", "10"],
      ["2", "Check valve", "EA", "5"],
    ],
    columnMapping: {},
  };

  it("reads cells by column index when columnMappingByIndex is provided", () => {
    const lines = mapImportRows({
      ...baseInput,
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    });

    expect(lines).toHaveLength(3);
    expect(lines[0]?.description).toBe("Section 15520 - (Valves)");
    expect(lines[0]?.isHeader).toBe(true);
    expect(lines[1]?.itemNo).toBe("1");
    expect(lines[1]?.description).toBe("Gate valve 2in");
    expect(lines[1]?.unit).toBe("EA");
    expect(lines[1]?.quantity).toBe("10");
    expect(lines[1]?.isMeasurable).toBe(true);
  });

  it("imports section header rows for full BOQ breakdown display", () => {
    const lines = mapImportRows({
      ...baseInput,
      columnMappingByIndex: {
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    });

    expect(lines.some((line) => line.isHeader)).toBe(true);
    expect(lines.some((line) => line.isMeasurable)).toBe(true);
  });

  it("counts measurable rows separately from section headers", () => {
    const payload = {
      ...baseInput,
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    };

    expect(mapImportRows(payload)).toHaveLength(3);
    expect(countMeasurableImportRows(payload)).toBe(2);
  });

  it("still imports rows with item number when description column is not mapped", () => {
    const lines = mapImportRows({
      ...baseInput,
      columnMappingByIndex: {
        "0": "item_no",
        "3": "quantity",
      },
    });

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.itemNo)).toBe(true);
    expect(lines.every((line) => !line.description)).toBe(true);
  });
});
