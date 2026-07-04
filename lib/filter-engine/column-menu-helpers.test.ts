import { describe, expect, it } from "vitest";

import {
  getColumnStatsSummary,
  getTopBottomFilterValues,
  isNumericColumn,
} from "./column-menu-helpers";
import type { FilterColumnDef } from "./types";

type Row = { score: number; label: string };

const column: FilterColumnDef<Row> = {
  id: "score",
  field: "score",
  label: "Score",
  filterType: "number",
};

describe("column-menu-helpers", () => {
  it("detects numeric columns", () => {
    expect(isNumericColumn(column)).toBe(true);
    expect(isNumericColumn({ ...column, filterType: "text" })).toBe(false);
  });

  it("returns top 10 numeric values", () => {
    const data = Array.from({ length: 15 }, (_, index) => ({ score: index + 1, label: `Row ${index}` }));
    const top = getTopBottomFilterValues(data, column, "top", 10);
    expect(top).toHaveLength(10);
    expect(top).toContain("15");
    expect(top).not.toContain("5");
  });

  it("summarizes column stats", () => {
    const data: Row[] = [
      { score: 10, label: "A" },
      { score: 20, label: "B" },
      { score: 0, label: "C" },
    ];
    const stats = getColumnStatsSummary(data, column);
    expect(stats.nonEmpty).toBe(3);
    expect(stats.empty).toBe(0);
    expect(stats.unique).toBe(3);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(20);
    expect(stats.avg).toBe(10);
  });
});
