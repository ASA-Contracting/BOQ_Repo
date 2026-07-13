import type { BoqListEntryDto } from "@/application/boq/dto";

export type BoqMasterListStats = {
  totalProjects: number;
  projectsWithBoq: number;
  projectsMissingBoq: number;
  totalBoqs: number;
  boqsPublished: number;
  boqsInProgress: number;
  boqsEmpty: number;
  measurableCount: number;
  categorizedCount: number;
  pendingCount: number;
  progressPercent: number;
  approvalApproved: number;
  approvalPending: number;
};

export function pickLatestVersionPerBoq(boqs: BoqListEntryDto[]): BoqListEntryDto[] {
  const byBoqId = new Map<number, BoqListEntryDto>();
  for (const entry of boqs) {
    const existing = byBoqId.get(entry.boqId);
    if (!existing || entry.versionId > existing.versionId) {
      byBoqId.set(entry.boqId, entry);
    }
  }
  return [...byBoqId.values()];
}

export function filterBoqsByDisciplines(
  boqs: BoqListEntryDto[],
  selectedDisciplines: string[] | null,
): BoqListEntryDto[] {
  if (selectedDisciplines === null) {
    return boqs;
  }

  if (selectedDisciplines.length === 0) {
    return [];
  }

  const normalized = new Set(selectedDisciplines.map((value) => value.trim().toLowerCase()));
  return boqs.filter((boq) => {
    const discipline = (boq.discipline ?? "—").trim().toLowerCase();
    return normalized.has(discipline);
  });
}

export function computeBoqMasterListStats(
  projects: ReadonlyArray<{ id: number }>,
  boqs: BoqListEntryDto[],
): BoqMasterListStats {
  const latest = pickLatestVersionPerBoq(boqs);
  const projectIdsWithBoq = new Set(latest.map((boq) => boq.projectId));

  let boqsPublished = 0;
  let boqsInProgress = 0;
  let boqsEmpty = 0;
  let measurableCount = 0;
  let categorizedCount = 0;
  let pendingCount = 0;
  let approvalApproved = 0;
  let approvalPending = 0;

  for (const boq of latest) {
    if (boq.status === "complete") {
      boqsPublished += 1;
    } else if (boq.status === "in_progress") {
      boqsInProgress += 1;
    } else {
      boqsEmpty += 1;
    }

    measurableCount += boq.measurableCount;
    categorizedCount += boq.categorizedCount;
    pendingCount += boq.pendingCount;

    if (boq.approvalStatus === "approved") {
      approvalApproved += 1;
    } else {
      approvalPending += 1;
    }
  }

  return {
    totalProjects: projects.length,
    projectsWithBoq: projectIdsWithBoq.size,
    projectsMissingBoq: Math.max(0, projects.length - projectIdsWithBoq.size),
    totalBoqs: latest.length,
    boqsPublished,
    boqsInProgress,
    boqsEmpty,
    measurableCount,
    categorizedCount,
    pendingCount,
    progressPercent:
      measurableCount === 0 ? 0 : Math.round((categorizedCount / measurableCount) * 100),
    approvalApproved,
    approvalPending,
  };
}

export function collectDisciplineOptions(
  boqs: BoqListEntryDto[],
  lookupNames: string[],
): string[] {
  const values = new Set<string>();

  for (const name of lookupNames) {
    const trimmed = name.trim();
    if (trimmed) {
      values.add(trimmed);
    }
  }

  for (const boq of boqs) {
    const trimmed = boq.discipline?.trim();
    if (trimmed) {
      values.add(trimmed);
    }
  }

  return [...values].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

export type BoqReviewChipFilter =
  | "projects-total"
  | "projects-with-boq"
  | "projects-missing"
  | "boqs-total"
  | "boqs-published"
  | "boqs-in-progress"
  | "boqs-approved"
  | "progress-published"
  | "progress-pending"
  | "progress-measurable"
  | "progress-complete";

export function filterBoqsByReviewChip(
  boqs: BoqListEntryDto[],
  chip: BoqReviewChipFilter | null,
): BoqListEntryDto[] {
  if (!chip) {
    return boqs;
  }

  const projectIdsWithBoq = new Set(pickLatestVersionPerBoq(boqs).map((entry) => entry.projectId));

  switch (chip) {
    case "projects-total":
    case "boqs-total":
      return boqs;
    case "projects-with-boq":
      return boqs.filter((boq) => projectIdsWithBoq.has(boq.projectId));
    case "projects-missing":
      return boqs.filter((boq) => !projectIdsWithBoq.has(boq.projectId));
    case "boqs-published":
      return boqs.filter((boq) => boq.status === "complete");
    case "boqs-in-progress":
      return boqs.filter((boq) => boq.status === "in_progress");
    case "boqs-approved":
      return boqs.filter((boq) => boq.approvalStatus === "approved");
    case "progress-published":
      return boqs.filter((boq) => boq.categorizedCount > 0);
    case "progress-pending":
      return boqs.filter((boq) => boq.pendingCount > 0);
    case "progress-measurable":
      return boqs.filter((boq) => boq.measurableCount > 0);
    case "progress-complete":
      return boqs.filter(
        (boq) => boq.measurableCount > 0 && boq.pendingCount === 0 && boq.status === "complete",
      );
    default:
      return boqs;
  }
}

export function reviewChipEmptyMessage(chip: BoqReviewChipFilter | null): string | null {
  if (chip === "projects-missing") {
    return "Missing-project rows are not in the BOQ list — open Projects to review projects without an import.";
  }
  return null;
}
