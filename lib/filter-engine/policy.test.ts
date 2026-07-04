import { describe, expect, it } from "vitest";

import {
  applyFilters,
  applySorts,
  buildGlobalSearchFilters,
  getDistinctValues,
  matchesFilter,
} from "./policy";
import type { FilterColumnDef, FilterState } from "./types";

type Row = {
  projectName: string;
  status: string;
  count: number;
};

const columns: FilterColumnDef<Row>[] = [
  { id: "project", field: "projectName", label: "Project", filterType: "text", searchable: true },
  { id: "status", field: "status", label: "Status", filterType: "select" },
  { id: "count", field: "count", label: "Count", filterType: "number" },
];

const rows: Row[] = [
  { projectName: "Alpha Tower", status: "complete", count: 10 },
  { projectName: "Beta Mall", status: "in_progress", count: 4 },
  { projectName: "Gamma Site", status: "empty", count: 0 },
];

describe("matchesFilter", () => {
  it("matches contains and in operators", () => {
    expect(matchesFilter("Alpha Tower", "tower", "contains", "text")).toBe(true);
    expect(matchesFilter("Alpha Tower", ["Beta Mall", "Alpha Tower"], "in", "text")).toBe(true);
    expect(matchesFilter("Alpha Tower", ["Beta Mall"], "in", "text")).toBe(false);
  });

  it("matches nothing when in filter has an empty selection", () => {
    expect(matchesFilter("Alpha Tower", [], "in", "text")).toBe(false);
  });
});

describe("applyFilters", () => {
  it("applies regular and global search filters", () => {
    const filters: FilterState[] = [
      { field: "status", operator: "equals", value: "complete" },
      ...buildGlobalSearchFilters("alpha", columns),
    ];

    const result = applyFilters(rows, filters, columns);
    expect(result).toHaveLength(1);
    expect(result[0]?.projectName).toBe("Alpha Tower");
  });
});

describe("applySorts", () => {
  it("sorts ascending and descending", () => {
    const asc = applySorts(rows, [{ field: "count", direction: "asc" }], columns);
    expect(asc.map((row) => row.count)).toEqual([0, 4, 10]);

    const desc = applySorts(rows, [{ field: "count", direction: "desc" }], columns);
    expect(desc.map((row) => row.count)).toEqual([10, 4, 0]);
  });
});

describe("getDistinctValues", () => {
  it("returns unique sorted values", () => {
    expect(getDistinctValues(rows, "status", columns[1])).toEqual([
      "complete",
      "empty",
      "in_progress",
    ]);
  });
});
