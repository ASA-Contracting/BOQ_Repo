import { describe, expect, it } from "vitest";

import {
  applySectionParentLabels,
  calcRowTotal,
  displayCellValue,
  formatMasterNo,
  insertBoqItemRowInOrder,
  isBlankCellValue,
  isSectionFormatRow,
  masterNoSortValue,
  patchBoqItemRow,
  removeBoqItemRow,
} from "./boq-breakdown-utils";

describe("boq-breakdown-utils", () => {
  it("hides blank numeric display values", () => {
    expect(displayCellValue(null)).toBe("");
    expect(displayCellValue("")).toBe("");
    expect(displayCellValue("  ")).toBe("");
    expect(displayCellValue("12")).toBe("12");
  });

  it("calculates total as quantity times rate", () => {
    expect(calcRowTotal("10", "2.5")).toBe("25");
    expect(calcRowTotal(null, "2")).toBe("");
    expect(calcRowTotal("3", null)).toBe("");
    expect(isBlankCellValue("0")).toBe(false);
  });

  it("recalculates total when quantity or rate changes", () => {
    const rows = patchBoqItemRow(
      [
        {
          id: 1,
          rowIndex: 1,
          masterNo: 1,
          itemNo: "1",
          description: "Item",
          unit: "m",
          quantity: "2",
          rate: "5",
          total: "0",
          isHeader: false,
          isMeasurable: true,
          materialNodeId: null,
          categoryLabel: null,
          categoryPath: null,
          sectionParentLabel: null,
        },
      ],
      1,
      { quantity: "3" },
    );

    expect(rows[0]?.total).toBe("15");
  });

  it("treats blank quantity as section-format row", () => {
    expect(isSectionFormatRow({ quantity: null } as never)).toBe(true);
    expect(isSectionFormatRow({ quantity: "" } as never)).toBe(true);
    expect(isSectionFormatRow({ quantity: "0" } as never)).toBe(false);
  });

  it("places section parent on the header row above categorized children", () => {
    const categoryOptions = [
      {
        id: 2,
        label: "Air Outlets",
        path: "HVAC / Air Outlets",
        depth: 1,
        parentId: 1,
        parentLabel: "HVAC",
        searchText: "air outlets",
      },
      {
        id: 3,
        label: "Ceiling Diffuser",
        path: "HVAC / Air Outlets / Ceiling Diffuser",
        depth: 2,
        parentId: 2,
        parentLabel: "Air Outlets",
        searchText: "ceiling diffuser",
      },
    ] as const;

    const enriched = applySectionParentLabels(
      [
        {
          id: 1,
          rowIndex: 1,
          masterNo: 1,
          itemNo: null,
          description: "AIR HANDLING UNIT:",
          unit: null,
          quantity: null,
          rate: null,
          total: null,
          isHeader: true,
          isMeasurable: false,
          materialNodeId: null,
          categoryLabel: null,
          categoryPath: null,
          sectionParentLabel: null,
        },
        {
          id: 2,
          rowIndex: 2,
          masterNo: 2,
          itemNo: null,
          description: "Supplying of air handling units",
          unit: null,
          quantity: null,
          rate: null,
          total: null,
          isHeader: true,
          isMeasurable: false,
          materialNodeId: null,
          categoryLabel: null,
          categoryPath: null,
          sectionParentLabel: null,
        },
        {
          id: 3,
          rowIndex: 3,
          masterNo: 3,
          itemNo: "1.1",
          description: "Ceiling Diffuser",
          unit: "nr",
          quantity: "1",
          rate: null,
          total: null,
          isHeader: false,
          isMeasurable: true,
          materialNodeId: 3,
          categoryLabel: "Ceiling Diffuser",
          categoryPath: null,
          sectionParentLabel: null,
        },
      ],
      new Map(categoryOptions.map((option) => [option.id, option])),
    );

    expect(enriched[0]?.sectionParentLabel).toBeNull();
    expect(enriched[1]?.sectionParentLabel).toBe("Air Outlets");
    expect(enriched[2]?.sectionParentLabel).toBeNull();
  });

  it("inserts and removes rows in client order", () => {
    const base = [
      {
        id: 1,
        rowIndex: 1,
        masterNo: 1,
        itemNo: "1",
        description: "First",
        unit: "m",
        quantity: "1",
        rate: "1",
        total: "1",
        isHeader: false,
        isMeasurable: true,
        materialNodeId: null,
        categoryLabel: null,
        categoryPath: null,
        sectionParentLabel: null,
      },
      {
        id: 2,
        rowIndex: 2,
        masterNo: 2,
        itemNo: "2",
        description: "Second",
        unit: "m",
        quantity: "1",
        rate: "1",
        total: "1",
        isHeader: false,
        isMeasurable: true,
        materialNodeId: null,
        categoryLabel: null,
        categoryPath: null,
        sectionParentLabel: null,
      },
    ];

    const inserted = insertBoqItemRowInOrder(
      base,
      {
        id: 99,
        rowIndex: 2,
        masterNo: null,
        itemNo: null,
        description: null,
        unit: null,
        quantity: null,
        rate: null,
        total: null,
        isHeader: false,
        isMeasurable: true,
        materialNodeId: null,
        categoryLabel: null,
        categoryPath: null,
        sectionParentLabel: null,
      },
      2,
      "before",
    );

    expect(inserted.map((row) => row.id)).toEqual([1, 99, 2]);
    expect(removeBoqItemRow(inserted, 99).map((row) => row.id)).toEqual([1, 2]);
  });

  it("formats master numbers and sort keys", () => {
    expect(formatMasterNo(12)).toBe("12");
    expect(formatMasterNo(null)).toBe("—");
    expect(masterNoSortValue(3)).toBe(3);
    expect(masterNoSortValue(null)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
