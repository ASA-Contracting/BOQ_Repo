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
    projectName: "Test Project",
    discipline: "Plumbing" as const,
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

  it("applies BOQ-level discipline to every imported row", () => {
    const lines = mapImportRows({
      ...baseInput,
      discipline: "Electrical",
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    });

    expect(lines.every((line) => line.contextSnapshot?.discipline === "Electrical")).toBe(true);
  });

  it("prefers Excel discipline column over BOQ-level discipline", () => {
    const lines = mapImportRows({
      ...baseInput,
      discipline: "Electrical",
      headers: ["A · BOQ #", "B · Item Description", "C · Unit", "D · QTY", "E · Trade"],
      rows: [
        ["", "Section 15520 - (Valves)", "", "", "Plumbing"],
        ["1", "Gate valve 2in", "EA", "10", "Plumbing"],
      ],
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
        "4": "discipline",
      },
    });

    expect(lines.every((line) => line.contextSnapshot?.discipline === "Plumbing")).toBe(true);
  });

  it("inherits section header description as parent section for child rows", () => {
    const lines = mapImportRows({
      ...baseInput,
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    });

    expect(lines[0]?.contextSnapshot?.sectionParent).toBe("Section 15520 - (Valves)");
    expect(lines[1]?.contextSnapshot?.section).toBe("Section 15520 - (Valves)");
    expect(lines[1]?.contextSnapshot?.sectionParent).toBe("Section 15520 - (Valves)");
    expect(lines[2]?.contextSnapshot?.section).toBe("Section 15520 - (Valves)");
  });

  it("resets inherited section when a new section header appears", () => {
    const lines = mapImportRows({
      ...baseInput,
      rows: [
        ["", "Mechanical Works", "", ""],
        ["1", "AHU", "EA", "2"],
        ["", "Electrical Works", "", ""],
        ["2", "Cable tray", "m", "50"],
      ],
      columnMappingByIndex: {
        "0": "item_no",
        "1": "description",
        "2": "unit",
        "3": "quantity",
      },
    });

    expect(lines[1]?.contextSnapshot?.section).toBe("Mechanical Works");
    expect(lines[3]?.contextSnapshot?.section).toBe("Electrical Works");
  });
});
