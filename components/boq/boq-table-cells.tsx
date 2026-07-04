import Link from "next/link";
import type { ReactNode } from "react";

import type { BoqWorkflowStatus } from "@/application/boq/dto";
import {
  approvalStatusTone,
  pillClass,
  progressFillClass,
  publishStatusTone,
  type BoqStatusTone,
} from "@/lib/design/boq-table-tokens";
import { cn } from "@/lib/utils";

const APPROVAL_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_engineer: "Pending engineer",
  pending_section_head: "Pending section head",
  approved: "Approved",
  returned: "Returned",
};

const PUBLISH_LABELS: Record<BoqWorkflowStatus, string> = {
  complete: "Published",
  in_progress: "Publishing",
  empty: "No measurables",
};

export function approvalLabel(status: string | null): string {
  if (!status) return "—";
  return APPROVAL_LABELS[status] ?? status;
}

export function publishLabel(status: BoqWorkflowStatus): string {
  return PUBLISH_LABELS[status];
}

type StatusPillProps = {
  tone: BoqStatusTone;
  children: ReactNode;
  className?: string;
};

export function StatusPill({ tone, children, className }: StatusPillProps) {
  return <span className={cn(pillClass(tone), className)}>{children}</span>;
}

export function ApprovalPill({ status }: { status: string | null }) {
  if (!status) return <span className="boq-dt-meta">—</span>;
  return (
    <StatusPill tone={approvalStatusTone(status)}>{approvalLabel(status)}</StatusPill>
  );
}

export function PublishPill({ status }: { status: BoqWorkflowStatus }) {
  return (
    <StatusPill tone={publishStatusTone(status)}>{publishLabel(status)}</StatusPill>
  );
}

export function VersionPill({ label }: { label: string }) {
  if (!label || label === "—") return <span className="boq-dt-meta">—</span>;
  return <StatusPill tone="neutral">{label}</StatusPill>;
}

type FamilyProgressProps = {
  categorizedCount: number;
  pendingCount: number;
  measurableCount: number;
  status: BoqWorkflowStatus;
};

export function FamilyProgressBar({
  categorizedCount,
  pendingCount,
  measurableCount,
  status,
}: FamilyProgressProps) {
  const percent =
    measurableCount === 0 ? 0 : Math.round((categorizedCount / measurableCount) * 100);
  const tone = publishStatusTone(status);

  return (
    <div className="boq-progress">
      <div className="boq-progress-labels boq-dt-tabular">
        <span>{categorizedCount} published</span>
        <span>{pendingCount} pending</span>
      </div>
      <div className="boq-progress-track">
        <div className={progressFillClass(tone)} style={{ width: `${percent}%` }} />
      </div>
      <div className="boq-progress-percent boq-dt-tabular">{percent}% published</div>
    </div>
  );
}

type ProjectBoqCellProps = {
  projectName: string;
  boqName: string;
  client: string | null;
  itemCount: number;
  measurableCount: number;
  projectHref?: string;
};

export function ProjectBoqCell({
  projectName,
  boqName,
  client,
  itemCount,
  measurableCount,
  projectHref = "/projects",
}: ProjectBoqCellProps) {
  const showBoqName = boqName.trim() !== projectName.trim();

  return (
    <div className="min-w-0 space-y-0.5">
      <Link href={projectHref} className="boq-dt-primary-link block truncate">
        {projectName}
      </Link>
      {showBoqName ? (
        <div className="boq-dt-secondary truncate">{boqName}</div>
      ) : null}
      {client ? <div className="boq-dt-meta truncate">{client}</div> : null}
      <div className="boq-dt-meta boq-dt-tabular">
        {itemCount.toLocaleString()} rows · {measurableCount.toLocaleString()} measurable
      </div>
    </div>
  );
}
