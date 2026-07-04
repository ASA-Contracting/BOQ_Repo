import { describe, expect, it } from "vitest";

import { calculateAggregate, formatAggregateValue, operationsForColumn } from "./aggregates";
import { buildGroupBlocks, getGroupValue, groupableColumns } from "./grouping";

describe("aggregates", () => {
  type Row = { qty: number; name: string };

  const numericColumn = {
    id: "qty",
    field: "qty",
    label: "Qty",
    filterType: "number" as const,
  };

  const textColumn = {
    id: "name",
    field: "name",
    label: "Name",
    filterType: "text" as const,
  };

  const rows: Row[] = [
    { qty: 10, name: "A" },
    { qty: 20, name: "B" },
    { qty: 5, name: "A" },
  ];

  it("sums numeric columns", () => {
    expect(calculateAggregate(rows, numericColumn, "sum")).toBe(35);
  });

  it("counts rows", () => {
    expect(calculateAggregate(rows, textColumn, "count")).toBe(3);
  });

  it("formats aggregate values", () => {
    expect(formatAggregateValue("sum", 1234.5)).toBe("1,234.5");
  });

  it("limits text column operations", () => {
    expect(operationsForColumn(textColumn)).toEqual(["count", "distinct"]);
  });
});

describe("grouping", () => {
  type Row = { project: string; value: number };

  const column = {
    id: "project",
    field: "project",
    label: "Project",
    filterType: "text" as const,
  };

  const rows: Row[] = [
    { project: "Beta", value: 1 },
    { project: "Alpha", value: 2 },
    { project: "Alpha", value: 3 },
  ];

  it("builds sorted group blocks", () => {
    const blocks = buildGroupBlocks(rows, column, "asc");
    expect(blocks.map((block) => block.label)).toEqual(["Alpha", "Beta"]);
    expect(blocks[0]?.rows).toHaveLength(2);
  });

  it("uses empty label for blank values", () => {
    expect(getGroupValue({ project: "  ", value: 1 }, column)).toBe("(Empty)");
  });

  it("filters groupable columns", () => {
    const columns = [
      column,
      { id: "id", field: "id", label: "ID", groupable: false },
    ];
    expect(groupableColumns(columns)).toHaveLength(1);
  });
});
