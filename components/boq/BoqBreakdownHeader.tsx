"use client";

import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Layers,
  Loader2,
  Upload,
} from "lucide-react";

import type { BoqBreakdownDto } from "@/application/boq/dto";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Select, SelectOption } from "@/components/ui/select";
import { useBoqLookupOptions } from "@/hooks/use-boq-lookup-options";
import { formatBoqVersionLabel, useBoqVersions } from "@/hooks/use-boq-versions";
import { cn } from "@/lib/utils";

import type { BoqSummaryFilter } from "@/components/boq/boq-breakdown-utils";
import {
  BOQ_HEADER_DEFAULT_WIDTHS,
  useBoqHeaderPanelWidths,
} from "@/components/boq/useBoqHeaderPanelWidths";

type StatChipProps = {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald" | "rose";
  highlight?: boolean;
  active?: boolean;
  onClick: () => void;
};

function StatChip({ label, value, tone, highlight = false, active = false, onClick }: StatChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "boq-breakdown__stat",
        `boq-breakdown__stat--${tone}`,
        highlight && !active && "boq-breakdown__stat--highlight",
        active && "boq-breakdown__stat--active",
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <div className="boq-breakdown__stat-label">{label}</div>
      <div className="boq-breakdown__stat-value">{value}</div>
    </button>
  );
}

function HeaderPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("boq-breakdown__panel", className)}>
      <h2 className="boq-breakdown__panel-title">{title}</h2>
      <div className="boq-breakdown__panel-body">{children}</div>
    </section>
  );
}

function ScopeCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("boq-breakdown__scope-cell", className)}>
      <span className="boq-breakdown__scope-cell-label">{label}</span>
      <div className="boq-breakdown__scope-cell-value">{children}</div>
    </div>
  );
}

export type BoqBreakdownHeaderProps = {
  breakdown: BoqBreakdownDto;
  discipline: string;
  disciplineSaving?: boolean;
  totalRows: number;
  sections: number;
  published: number;
  pending: number;
  measurableCount: number;
  workflowPending: boolean;
  workflowMessage: string | null;
  workflowError: string | null;
  categoryError: string | null;
  rowActionError: string | null;
  disciplineError?: string | null;
  importHref: string;
  summaryFilter: BoqSummaryFilter;
  onSummaryFilterChange: (filter: BoqSummaryFilter) => void;
  onDisciplineChange: (discipline: string) => void;
  onApproveVersion: () => void;
  onDuplicateVersion: () => void;
  onSelectVersion: (versionId: number) => void;
  onOpenCategoryBuilder?: () => void;
};

export function BoqBreakdownHeader({
  breakdown,
  discipline,
  disciplineSaving = false,
  totalRows,
  sections,
  published,
  pending,
  measurableCount: _measurableCount,
  workflowPending,
  workflowMessage,
  workflowError,
  categoryError,
  rowActionError,
  disciplineError = null,
  importHref,
  summaryFilter,
  onSummaryFilterChange,
  onDisciplineChange,
  onApproveVersion,
  onDuplicateVersion,
  onSelectVersion,
  onOpenCategoryBuilder,
}: BoqBreakdownHeaderProps) {
  const isApproved = breakdown.isApproved;
  const canApprove = !isApproved && breakdown.versionId != null;
  const { items: disciplineOptions, loading: disciplineLoading, error: disciplineLoadError } =
    useBoqLookupOptions("discipline");
  const {
    versions,
    loading: versionsLoading,
    error: versionsError,
    ensureLoaded: ensureVersionsLoaded,
  } = useBoqVersions(breakdown.id, breakdown.versionId);

  const disciplineChoices =
    !discipline || disciplineOptions.some((option) => option.name === discipline)
      ? disciplineOptions
      : [{ id: -1, name: discipline, category: "discipline" as const }, ...disciplineOptions];

  const versionLabel =
    breakdown.versionName ??
    (breakdown.versionNumber ? `Version ${breakdown.versionNumber}` : "Draft");

  const shortVersionLabel =
    breakdown.versionNumber != null ? `v${breakdown.versionNumber}` : isApproved ? "Approved" : "Draft";

  const disciplineDisabled =
    isApproved ||
    disciplineLoading ||
    disciplineSaving ||
    (disciplineChoices.length === 0 && !discipline);

  const { containerRef, widths, startResize, resizerWidth } = useBoqHeaderPanelWidths();

  const panels = [
    {
      key: "discipline",
      title: "Discipline",
      className: "boq-breakdown__panel--discipline",
      content: (
        <Select
          id="boq-breakdown-discipline"
          className="boq-breakdown__discipline-select"
          inputSize="sm"
          value={discipline}
          onChange={(event) => onDisciplineChange(event.target.value)}
          disabled={disciplineDisabled}
          title={
            isApproved
              ? "Discipline is locked on approved versions"
              : disciplineLoadError ?? undefined
          }
        >
          <SelectOption value="">
            {disciplineLoading ? "Loading…" : "Select discipline…"}
          </SelectOption>
          {disciplineChoices.map((option) => (
            <SelectOption key={option.id} value={option.name}>
              {option.name}
            </SelectOption>
          ))}
        </Select>
      ),
    },
    {
      key: "project",
      title: "Project",
      className: "boq-breakdown__panel--project",
      content: (
        <div
          className="boq-breakdown__scope-pill"
          title={`${breakdown.projectName} · ${breakdown.name} · ${versionLabel}`}
        >
          <ScopeCell label="Project">
            <span className="boq-breakdown__scope-text">{breakdown.projectName}</span>
          </ScopeCell>
          <ScopeCell label="BOQ">
            <span className="boq-breakdown__scope-text">{breakdown.name}</span>
          </ScopeCell>
          <ScopeCell label="Version" className="boq-breakdown__scope-cell--version">
            <Dropdown
              onOpenChange={(open) => {
                if (open) ensureVersionsLoaded();
              }}
            >
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "boq-breakdown__scope-version boq-breakdown__scope-version-btn",
                    isApproved
                      ? "boq-breakdown__scope-version--approved"
                      : "boq-breakdown__scope-version--draft",
                  )}
                  aria-label={`Current version: ${versionLabel}. Show all versions.`}
                >
                  {shortVersionLabel}
                  <ChevronDown size={10} aria-hidden />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" className="min-w-[12rem]">
                <DropdownLabel>Versions</DropdownLabel>
                <DropdownSeparator />
                {versionsLoading ? (
                  <DropdownItem disabled className="gap-2">
                    <Loader2 size={12} className="animate-spin" aria-hidden />
                    Loading…
                  </DropdownItem>
                ) : versionsError ? (
                  <DropdownItem disabled>{versionsError}</DropdownItem>
                ) : versions.length === 0 ? (
                  <DropdownItem disabled>No versions found</DropdownItem>
                ) : (
                  versions.map((version) => {
                    const label = formatBoqVersionLabel(version);
                    const isCurrent = version.isCurrent;
                    return (
                      <DropdownItem
                        key={version.id}
                        disabled={isCurrent}
                        onSelect={() => onSelectVersion(version.id)}
                        className="gap-2"
                      >
                        {isCurrent ? <Check size={12} aria-hidden /> : null}
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {version.approvalStatus === "approved" ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Approved
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Draft
                          </span>
                        )}
                      </DropdownItem>
                    );
                  })
                )}
              </DropdownContent>
            </Dropdown>
          </ScopeCell>
        </div>
      ),
    },
    {
      key: "approval",
      title: "Approval",
      className: "boq-breakdown__panel--approval",
      content: (
        <div className="boq-breakdown__approval-flow">
          <span
            className={cn(
              "boq-breakdown__approval-chip",
              !isApproved && "boq-breakdown__approval-chip--active",
              isApproved && "boq-breakdown__approval-chip--done",
            )}
          >
            Draft
          </span>
          <ArrowRight size={12} className="boq-breakdown__approval-arrow" aria-hidden />
          {isApproved ? (
            <span className="boq-breakdown__approval-chip boq-breakdown__approval-chip--done">
              <Check size={11} aria-hidden />
              {versionLabel}
            </span>
          ) : (
            <button
              type="button"
              className="boq-breakdown__approve-btn"
              onClick={onApproveVersion}
              disabled={!canApprove || workflowPending}
            >
              {workflowPending ? (
                <Loader2 size={12} className="animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 size={12} aria-hidden />
              )}
              Approve version
            </button>
          )}
        </div>
      ),
    },
    {
      key: "summary",
      title: "Summary",
      className: "boq-breakdown__panel--summary",
      content: (
        <div className="boq-breakdown__stats">
          <StatChip
            label="Total rows"
            value={totalRows}
            tone="slate"
            active={summaryFilter === "all"}
            onClick={() => onSummaryFilterChange("all")}
          />
          <StatChip
            label="Sections"
            value={sections}
            tone="amber"
            active={summaryFilter === "sections"}
            onClick={() => onSummaryFilterChange("sections")}
          />
          <StatChip
            label="Published"
            value={published}
            tone="emerald"
            active={summaryFilter === "published"}
            onClick={() => onSummaryFilterChange("published")}
          />
          <StatChip
            label="Pending"
            value={pending}
            tone="rose"
            highlight={pending > 0}
            active={summaryFilter === "pending"}
            onClick={() => onSummaryFilterChange("pending")}
          />
        </div>
      ),
    },
    {
      key: "edits",
      title: "Edits",
      className: "boq-breakdown__panel--edits",
      content: (
        <div className="boq-breakdown__actions">
          {onOpenCategoryBuilder ? (
            <button
              type="button"
              className="boq-breakdown__action-btn"
              onClick={onOpenCategoryBuilder}
            >
              <Layers size={13} aria-hidden />
              Category builder
            </button>
          ) : null}

          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="boq-breakdown__action-btn boq-breakdown__action-btn--menu"
                disabled={workflowPending}
              >
                <Upload size={13} aria-hidden />
                New version
                <ChevronDown size={12} aria-hidden />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" className="min-w-[11rem]">
              <DropdownItem asChild>
                <Link href={importHref} className="flex items-center gap-2">
                  <Upload size={14} aria-hidden />
                  Import from Excel
                </Link>
              </DropdownItem>
              <DropdownItem
                disabled={breakdown.versionId == null || workflowPending}
                onSelect={() => onDuplicateVersion()}
                className="gap-2"
              >
                <Copy size={14} aria-hidden />
                Duplicate current version
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      ),
    },
  ] as const;

  return (
    <header className="boq-breakdown__header">
      <div ref={containerRef} className="boq-breakdown__header-grid">
        {panels.map((panel, index) => (
          <Fragment key={panel.key}>
            <div
              className="boq-breakdown__panel-slot"
              style={
                widths
                  ? {
                      width: widths[index],
                      flexBasis: widths[index],
                      flexGrow: 0,
                      flexShrink: 0,
                    }
                  : {
                      width: BOQ_HEADER_DEFAULT_WIDTHS[index],
                      flexBasis: BOQ_HEADER_DEFAULT_WIDTHS[index],
                      flexGrow: 0,
                      flexShrink: 0,
                    }
              }
            >
              <HeaderPanel title={panel.title} className={panel.className}>
                {panel.content}
              </HeaderPanel>
            </div>
            {index < panels.length - 1 ? (
              <div
                className="boq-breakdown__panel-resizer"
                style={{ width: resizerWidth, flexBasis: resizerWidth }}
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize ${panel.title} and ${panels[index + 1].title} sections`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  startResize(index, event.clientX);
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </div>

      {workflowMessage ? (
        <p className="boq-breakdown__notice" role="status">
          {workflowMessage}
        </p>
      ) : null}
      {workflowError ? (
        <p className="boq-breakdown__error" role="alert">
          {workflowError}
        </p>
      ) : null}
      {disciplineLoadError && !isApproved ? (
        <p className="boq-breakdown__error" role="alert">
          {disciplineLoadError}
        </p>
      ) : null}
      {disciplineError ? (
        <p className="boq-breakdown__error" role="alert">
          {disciplineError}
        </p>
      ) : null}
      {categoryError ? (
        <p className="boq-breakdown__error" role="alert">
          {categoryError}
        </p>
      ) : null}
      {rowActionError ? (
        <p className="boq-breakdown__error" role="alert">
          {rowActionError}
        </p>
      ) : null}
    </header>
  );
}
