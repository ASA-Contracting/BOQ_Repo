"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, ExternalLink } from "lucide-react";

import type { BoqListEntryDto, BoqWorkflowStatus } from "@/application/boq/dto";
import { cn } from "@/lib/utils";

const WORKFLOW_LABELS: Record<string, string> = {
  imported: "Imported",
  ai_running: "AI running",
  ready_for_engineer_review: "Engineer review",
  awaiting_section_head: "Awaiting section head",
  version_approved: "Version approved",
  completed: "Completed",
};

const APPROVAL_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_engineer: "Pending engineer",
  pending_section_head: "Pending section head",
  approved: "Approved",
  returned: "Returned",
};

const PUBLISH_BADGE: Record<
  BoqWorkflowStatus,
  { label: string; tone: "green" | "orange" | "gray" }
> = {
  complete: { label: "Published", tone: "green" },
  in_progress: { label: "Publishing", tone: "orange" },
  empty: { label: "No measurable", tone: "gray" },
};

export function formatBoqDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function boqProgressPercent(boq: BoqListEntryDto): number {
  if (boq.measurableCount === 0) return 0;
  return Math.round((boq.categorizedCount / boq.measurableCount) * 100);
}

export function isWorkshopIncomplete(boq: BoqListEntryDto): boolean {
  return boq.batchId != null && boq.status !== "complete" && boq.status !== "empty";
}

export function boqRowHref(boq: BoqListEntryDto): string {
  if (isWorkshopIncomplete(boq)) {
    return `/workshop/categorize/${boq.batchId}`;
  }
  return `/boq/${boq.boqId}`;
}

export function boqRowActionLabel(boq: BoqListEntryDto): string {
  if (isWorkshopIncomplete(boq)) {
    return "Continue categorization";
  }
  return "View breakdown";
}

export function workflowLabel(boq: BoqListEntryDto): string {
  return WORKFLOW_LABELS[boq.workflowStage ?? ""] ?? boq.workflowStage ?? "—";
}

export function approvalLabel(boq: BoqListEntryDto): string {
  return APPROVAL_LABELS[boq.approvalStatus ?? ""] ?? boq.approvalStatus ?? "—";
}

export function versionLabel(boq: BoqListEntryDto): string {
  return boq.versionName ?? (boq.versionNumber ? `v${boq.versionNumber}` : "");
}

type PillTone = "gray" | "green" | "yellow" | "orange" | "blue" | "purple";

export function BmlBadge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span className={cn("pill", `tone-${tone}`, className)}>
      <span className="pill__label">{children}</span>
    </span>
  );
}

export function BoqStatusCell({ boq }: { boq: BoqListEntryDto }) {
  const publish = PUBLISH_BADGE[boq.status];

  return <BmlBadge tone={publish.tone}>{publish.label}</BmlBadge>;
}

export function BoqProgressCell({ boq }: { boq: BoqListEntryDto }) {
  const percent = boqProgressPercent(boq);

  return (
    <div className="bml-progress">
      <div className="bml-progress__bar" aria-hidden>
        <div
          className="bml-progress__fill"
          style={{ ["--bml-progress" as string]: `${percent}%` }}
        />
      </div>
      <p className="bml-progress__label">
        <strong>{boq.categorizedCount}</strong> published · {boq.pendingCount} pending
      </p>
    </div>
  );
}

export function BoqImportCell({ boq }: { boq: BoqListEntryDto }) {
  return <div className="bml-cell-primary">{formatBoqDate(boq.importedAt)}</div>;
}

export function boqOpenButtonLabel(boq: BoqListEntryDto): string {
  if (isWorkshopIncomplete(boq)) {
    return "Continue";
  }
  return "Open";
}

export function BoqNameCell({
  boq,
  showProject = false,
  selectionMode = false,
  onSelect,
}: {
  boq: BoqListEntryDto;
  showProject?: boolean;
  selectionMode?: boolean;
  onSelect?: (boq: BoqListEntryDto) => void;
}) {
  const href = boqRowHref(boq);
  const actionLabel = boqRowActionLabel(boq);

  return (
    <div className="bml-cell-wrap">
      {showProject ? (
        <div className="bml-cell-primary">{boq.projectName}</div>
      ) : null}
      {selectionMode && onSelect ? (
        <button
          type="button"
          className="bml-open-target"
          aria-label={`${actionLabel}: ${boq.name}`}
          title={actionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(boq);
          }}
        >
          <span className="bml-open-target__name">{boq.name}</span>
          <ArrowUpRight size={13} className="bml-open-target__icon" aria-hidden />
        </button>
      ) : (
        <Link
          href={href}
          className="bml-open-target"
          aria-label={`${actionLabel}: ${boq.name}`}
          title={actionLabel}
        >
          <span className="bml-open-target__name">{boq.name}</span>
          <ArrowUpRight size={13} className="bml-open-target__icon" aria-hidden />
        </Link>
      )}
      <div className="bml-cell-secondary">
        {boq.itemCount} rows · {boq.measurableCount} measurable
      </div>
      {boq.client ? <div className="bml-cell-tertiary">{boq.client}</div> : null}
    </div>
  );
}

export function BoqRowAction({
  boq,
  selectionMode = false,
  onSelect,
}: {
  boq: BoqListEntryDto;
  selectionMode?: boolean;
  onSelect?: (boq: BoqListEntryDto) => void;
}) {
  const label = boqOpenButtonLabel(boq);
  const href = boqRowHref(boq);
  const incomplete = isWorkshopIncomplete(boq);

  if (selectionMode && onSelect) {
    return (
      <button
        type="button"
        className={cn("bml-open-btn", incomplete && "bml-open-btn--continue")}
        aria-label={`${boqRowActionLabel(boq)}: ${boq.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(boq);
        }}
      >
        {label}
        <ArrowRight size={13} aria-hidden />
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={cn("bml-open-btn", incomplete && "bml-open-btn--continue")}
      aria-label={`${boqRowActionLabel(boq)}: ${boq.name}`}
    >
      {label}
      <ArrowRight size={13} aria-hidden />
    </Link>
  );
}

function summarizeGroupStatus(rows: BoqListEntryDto[]): string {
  const counts = { complete: 0, in_progress: 0, empty: 0 };
  for (const row of rows) {
    counts[row.status] += 1;
  }

  const parts: string[] = [];
  if (counts.complete) parts.push(`${counts.complete} published`);
  if (counts.in_progress) parts.push(`${counts.in_progress} publishing`);
  if (counts.empty) parts.push(`${counts.empty} empty`);

  return parts.join(" · ") || "—";
}

export function BoqProjectGroupHeader({
  block,
  expanded,
  toggle,
}: {
  block: { label: string; rows: BoqListEntryDto[] };
  expanded: boolean;
  toggle: () => void;
}) {
  const projectId = block.rows[0]?.projectId;
  const summary = summarizeGroupStatus(block.rows);

  return (
    <div
      className="group-row-content bml-group-header"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Collapse" : "Expand"} project ${block.label}`}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <div className="group-row-main">
        <span className="group-toggle" aria-hidden>
          <ChevronDown
            size={12}
            className={cn("chevron transition-transform", !expanded && "-rotate-90")}
          />
        </span>
        <div className="group-row-title">
          <span className="group-row-pill">
            <span className="pill__label">{block.label}</span>
          </span>
          <span className="group-row-count">{block.rows.length}</span>
        </div>
      </div>

      <span className="bml-group-header__summary">{summary}</span>

      <div
        className="bml-group-header__actions"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {projectId ? (
          <Link href="/projects" className="bml-row-action" aria-label="View projects">
            <ExternalLink size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export {
  WORKFLOW_LABELS,
  APPROVAL_LABELS,
  PUBLISH_BADGE,
};
