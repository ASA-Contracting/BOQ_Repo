import { describe, expect, it } from "vitest";

import type { BoqListEntryDto } from "@/application/boq/dto";

import {
  collectDisciplineOptions,
  computeBoqMasterListStats,
  filterBoqsByDisciplines,
  filterBoqsByReviewChip,
  pickLatestVersionPerBoq,
} from "./master-list-stats";

function makeBoq(overrides: Partial<BoqListEntryDto> & Pick<BoqListEntryDto, "id" | "boqId" | "versionId">): BoqListEntryDto {
  return {
    batchId: null,
    name: "BOQ A",
    projectId: 1,
    projectName: "Project A",
    scopeLabel: "Project A · BOQ A",
    discipline: "Mechanical",
    abrdProjectId: null,
    externalSource: "local",
    client: "Client",
    versionName: "Draft",
    versionNumber: 1,
    approvalStatus: "draft",
    workflowStage: "imported",
    itemCount: 10,
    measurableCount: 8,
    categorizedCount: 4,
    pendingCount: 4,
    status: "in_progress",
    importedAt: null,
    importedById: null,
    importedByName: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("pickLatestVersionPerBoq", () => {
  it("keeps the highest version id per BOQ", () => {
    const rows = [
      makeBoq({ id: 1, boqId: 10, versionId: 1, versionName: "v1" }),
      makeBoq({ id: 2, boqId: 10, versionId: 3, versionName: "v3" }),
      makeBoq({ id: 3, boqId: 11, versionId: 2, versionName: "v2" }),
    ];

    const latest = pickLatestVersionPerBoq(rows);
    expect(latest).toHaveLength(2);
    expect(latest.find((row) => row.boqId === 10)?.versionId).toBe(3);
    expect(latest.find((row) => row.boqId === 11)?.versionId).toBe(2);
  });
});

describe("filterBoqsByDisciplines", () => {
  it("returns all rows when all disciplines are selected (null)", () => {
    const rows = [makeBoq({ id: 1, boqId: 1, versionId: 1 })];
    expect(filterBoqsByDisciplines(rows, null)).toEqual(rows);
  });

  it("returns no rows when no disciplines are selected", () => {
    const rows = [makeBoq({ id: 1, boqId: 1, versionId: 1 })];
    expect(filterBoqsByDisciplines(rows, [])).toEqual([]);
  });

  it("filters rows by one or more disciplines", () => {
    const rows = [
      makeBoq({ id: 1, boqId: 1, versionId: 1, discipline: "Mechanical" }),
      makeBoq({ id: 2, boqId: 2, versionId: 1, discipline: "Electrical" }),
    ];

    expect(filterBoqsByDisciplines(rows, ["Mechanical", "Plumbing"])).toHaveLength(1);
    expect(filterBoqsByDisciplines(rows, ["Mechanical", "Electrical"])).toHaveLength(2);
  });
});

describe("computeBoqMasterListStats", () => {
  it("aggregates portfolio progress from latest BOQ versions", () => {
    const projects = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const rows = [
      makeBoq({
        id: 1,
        boqId: 10,
        versionId: 1,
        projectId: 1,
        measurableCount: 10,
        categorizedCount: 10,
        pendingCount: 0,
        status: "complete",
        approvalStatus: "approved",
      }),
      makeBoq({
        id: 2,
        boqId: 10,
        versionId: 2,
        projectId: 1,
        measurableCount: 10,
        categorizedCount: 5,
        pendingCount: 5,
        status: "in_progress",
        approvalStatus: "draft",
      }),
      makeBoq({
        id: 3,
        boqId: 11,
        versionId: 1,
        projectId: 2,
        measurableCount: 0,
        categorizedCount: 0,
        pendingCount: 0,
        status: "empty",
        approvalStatus: "draft",
      }),
    ];

    const stats = computeBoqMasterListStats(projects, rows);

    expect(stats.totalProjects).toBe(3);
    expect(stats.projectsWithBoq).toBe(2);
    expect(stats.projectsMissingBoq).toBe(1);
    expect(stats.totalBoqs).toBe(2);
    expect(stats.boqsPublished).toBe(0);
    expect(stats.boqsInProgress).toBe(1);
    expect(stats.boqsEmpty).toBe(1);
    expect(stats.measurableCount).toBe(10);
    expect(stats.categorizedCount).toBe(5);
    expect(stats.pendingCount).toBe(5);
    expect(stats.progressPercent).toBe(50);
    expect(stats.approvalApproved).toBe(0);
    expect(stats.approvalPending).toBe(2);
  });
});

describe("collectDisciplineOptions", () => {
  it("merges lookup names with BOQ disciplines and sorts them", () => {
    const rows = [
      makeBoq({ id: 1, boqId: 1, versionId: 1, discipline: "Plumbing" }),
      makeBoq({ id: 2, boqId: 2, versionId: 1, discipline: "Electrical" }),
    ];

    expect(collectDisciplineOptions(rows, ["Mechanical", "Electrical"])).toEqual([
      "Electrical",
      "Mechanical",
      "Plumbing",
    ]);
  });
});
