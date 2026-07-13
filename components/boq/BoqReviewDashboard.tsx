"use client";

import { Fragment } from "react";

import { BoqDisciplineToolbarFilter } from "@/components/boq/BoqDisciplineToolbarFilter";
import { useBoqMasterListHeaderPanelWidths } from "@/components/boq/useBoqMasterListHeaderPanelWidths";
import type { BoqMasterListStats, BoqReviewChipFilter } from "@/lib/boq/master-list-stats";
import { cn } from "@/lib/utils";

import "@/styles/boq-breakdown.css";

type ReviewPanelProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
};

function ReviewPanel({ title, className, children }: ReviewPanelProps) {
  return (
    <section className={cn("boq-breakdown__panel bml-review-panel", className)}>
      <h2 className="boq-breakdown__panel-title">{title}</h2>
      <div className="boq-breakdown__panel-body">{children}</div>
    </section>
  );
}

type StatChipProps = {
  chipId: BoqReviewChipFilter;
  label: string;
  value: number | string;
  tone: "slate" | "amber" | "emerald" | "rose";
  activeChipFilter: BoqReviewChipFilter | null;
  onChipFilterChange: (chip: BoqReviewChipFilter | null) => void;
};

function ReviewStatChip({
  chipId,
  label,
  value,
  tone,
  activeChipFilter,
  onChipFilterChange,
}: StatChipProps) {
  const active = activeChipFilter === chipId;

  return (
    <button
      type="button"
      className={cn(
        "boq-breakdown__stat",
        `boq-breakdown__stat--${tone}`,
        active && "boq-breakdown__stat--active",
      )}
      aria-pressed={active}
      aria-label={`${label}: ${value}. ${active ? "Clear filter" : "Filter list"}.`}
      onClick={() => onChipFilterChange(active ? null : chipId)}
    >
      <div className="boq-breakdown__stat-label">{label}</div>
      <div className="boq-breakdown__stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </button>
  );
}

type Props = {
  stats: BoqMasterListStats;
  disciplineOptions: string[];
  selectedDisciplines: string[] | null;
  onDisciplineChange: (selected: string[] | null) => void;
  disciplineLoading?: boolean;
  activeChipFilter: BoqReviewChipFilter | null;
  onChipFilterChange: (chip: BoqReviewChipFilter | null) => void;
  actions: React.ReactNode;
};

export function BoqReviewDashboard({
  stats,
  disciplineOptions,
  selectedDisciplines,
  onDisciplineChange,
  disciplineLoading = false,
  activeChipFilter,
  onChipFilterChange,
  actions,
}: Props) {
  const { containerRef, widths, startResize, resizerWidth, defaultWidths } =
    useBoqMasterListHeaderPanelWidths();

  const panels = [
    {
      key: "discipline",
      title: "Discipline",
      className: "boq-breakdown__panel--discipline",
      content: (
        <BoqDisciplineToolbarFilter
          options={disciplineOptions}
          selected={selectedDisciplines}
          onChange={onDisciplineChange}
          loading={disciplineLoading}
        />
      ),
    },
    {
      key: "projects",
      title: "Projects",
      className: "boq-breakdown__panel--projects",
      content: (
        <div className="boq-breakdown__stats">
          <ReviewStatChip
            chipId="projects-total"
            label="Total"
            value={stats.totalProjects}
            tone="slate"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="projects-with-boq"
            label="With BOQ"
            value={stats.projectsWithBoq}
            tone="emerald"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="projects-missing"
            label="Missing"
            value={stats.projectsMissingBoq}
            tone="rose"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
        </div>
      ),
    },
    {
      key: "boqs",
      title: "BOQs",
      className: "boq-breakdown__panel--boqs",
      content: (
        <div className="boq-breakdown__stats">
          <ReviewStatChip
            chipId="boqs-total"
            label="Total"
            value={stats.totalBoqs}
            tone="slate"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="boqs-published"
            label="Published"
            value={stats.boqsPublished}
            tone="emerald"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="boqs-in-progress"
            label="In progress"
            value={stats.boqsInProgress}
            tone="amber"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="boqs-approved"
            label="Approved"
            value={stats.approvalApproved}
            tone="emerald"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
        </div>
      ),
    },
    {
      key: "progress",
      title: "Progress",
      className: "boq-breakdown__panel--summary",
      content: (
        <div className="boq-breakdown__stats">
          <ReviewStatChip
            chipId="progress-published"
            label="Published"
            value={stats.categorizedCount}
            tone="emerald"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="progress-pending"
            label="Pending"
            value={stats.pendingCount}
            tone="rose"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="progress-measurable"
            label="Measurable"
            value={stats.measurableCount}
            tone="slate"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
          <ReviewStatChip
            chipId="progress-complete"
            label="Complete"
            value={`${stats.progressPercent}%`}
            tone="amber"
            activeChipFilter={activeChipFilter}
            onChipFilterChange={onChipFilterChange}
          />
        </div>
      ),
    },
  ] as const;

  return (
    <header className="bml-toolbar boq-breakdown__header" aria-label="BOQ portfolio review">
      <div className="bml-toolbar__panels">
        <div ref={containerRef} className="boq-breakdown__header-grid bml-toolbar__header-grid">
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
                        width: defaultWidths[index],
                        flexBasis: defaultWidths[index],
                        flexGrow: 0,
                        flexShrink: 0,
                      }
                }
              >
                <ReviewPanel title={panel.title} className={panel.className}>
                  {panel.content}
                </ReviewPanel>
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
      </div>
      <div className="bml-toolbar__actions boq-master-list__actions">{actions}</div>
    </header>
  );
}
