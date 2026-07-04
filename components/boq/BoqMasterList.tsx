"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Plus } from "lucide-react";

import type { BoqListEntryDto } from "@/application/boq/dto";
import {
  BoqImportCell,
  BoqNameCell,
  BoqProgressCell,
  BoqProjectGroupHeader,
  BoqRowAction,
  BoqStatusCell,
  PUBLISH_BADGE,
  approvalLabel,
  versionLabel,
  workflowLabel,
} from "@/components/boq/boq-master-list-cells";
import { BoqSettingsModal, BoqSettingsToolbarButton } from "@/components/boq/BoqSettingsModal";
import {
  FilterableDataGrid,
  type FilterableColumn,
} from "@/components/filter-engine";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";

import "@/styles/boq-master-list.css";

type Props = {
  boqs: BoqListEntryDto[];
  error?: string | null;
  onOpenProjects?: () => void;
};

function buildGridColumns(): FilterableColumn<BoqListEntryDto>[] {
  return [
    {
      id: "project",
      field: "projectName",
      label: "Project",
      filterType: "text",
      searchable: true,
      header: "Project",
      className: "min-w-[8rem]",
      cell: (boq) => <div className="bml-cell-primary">{boq.projectName}</div>,
    },
    {
      id: "discipline",
      field: "discipline",
      label: "Discipline",
      filterType: "select",
      getValue: (boq) => boq.discipline ?? "—",
      header: "Discipline",
      className: "min-w-[8rem]",
      cell: (boq) => <div className="bml-cell-primary">{boq.discipline ?? "—"}</div>,
    },
    {
      id: "boq",
      field: "name",
      label: "BOQ",
      filterType: "text",
      searchable: true,
      header: "BOQ",
      className: "min-w-[12rem]",
      cell: (boq) => <BoqNameCell boq={boq} />,
    },
    {
      id: "version",
      field: "versionName",
      label: "Version",
      filterType: "text",
      getValue: (boq) => boq.versionName ?? (boq.versionNumber ? `v${boq.versionNumber}` : "—"),
      header: "Version",
      className: "min-w-[6rem]",
      cell: (boq) => (
        <div className="bml-cell-primary">{versionLabel(boq) || "—"}</div>
      ),
    },
    {
      id: "workflow",
      field: "workflowStage",
      label: "Workflow",
      filterType: "select",
      getValue: workflowLabel,
      header: "Workflow",
      className: "min-w-[9rem]",
      cell: (boq) => <div className="bml-cell-primary">{workflowLabel(boq)}</div>,
    },
    {
      id: "approval",
      field: "approvalStatus",
      label: "Approval",
      filterType: "select",
      getValue: approvalLabel,
      header: "Approval",
      className: "min-w-[8rem]",
      cell: (boq) => <div className="bml-cell-primary">{approvalLabel(boq)}</div>,
    },
    {
      id: "status",
      field: "status",
      label: "Status",
      filterType: "select",
      getValue: (boq) => PUBLISH_BADGE[boq.status].label,
      header: "Status",
      className: "min-w-[9rem]",
      cell: (boq) => <BoqStatusCell boq={boq} />,
    },
    {
      id: "progress",
      field: "categorizedCount",
      label: "Progress",
      filterType: "number",
      sortable: true,
      filterable: false,
      header: "Progress",
      className: "min-w-[10rem]",
      cell: (boq) => <BoqProgressCell boq={boq} />,
    },
    {
      id: "importedAt",
      field: "importedAt",
      label: "Imported",
      filterType: "date",
      header: "Import",
      className: "min-w-[10rem]",
      cell: (boq) => <BoqImportCell boq={boq} />,
    },
    {
      id: "importedBy",
      field: "importedByName",
      label: "Imported by",
      filterType: "text",
      getValue: (boq) => boq.importedByName ?? boq.importedById ?? "Unknown",
      header: "Imported by",
      className: "min-w-[8rem]",
      cell: (boq) => (
        <div className="bml-cell-primary">
          {boq.importedByName ?? boq.importedById ?? "Unknown"}
        </div>
      ),
    },
    {
      id: "actions",
      field: "id",
      label: "Open",
      sortable: false,
      filterable: false,
      searchable: false,
      hideFromChooser: true,
      header: "Open",
      headerClassName: "w-[5.5rem]",
      className: "w-[5.5rem]",
      cell: (boq) => <BoqRowAction boq={boq} />,
    },
  ];
}

export function BoqMasterList({
  boqs,
  error = null,
  onOpenProjects,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const gridColumns = useMemo(() => buildGridColumns(), []);

  const content = (
    <div className="boq-master-list__page">
        <header className="boq-master-list__header">
          <div>
            <h1 className="boq-master-list__title">BOQ master list</h1>
            <p className="boq-master-list__subtitle">
              Production bills of quantities. Family assignment happens in Workshop; this view
              shows published progress only.
            </p>
          </div>
          <div className="boq-master-list__actions">
            {onOpenProjects ? (
              <button
                type="button"
                className="boq-master-list__projects-btn"
                onClick={onOpenProjects}
              >
                <Briefcase size={14} aria-hidden />
                Projects
              </button>
            ) : null}
            <Link href="/boq/import" className="boq-master-list__add-btn">
              Add New BOQ
            </Link>
          </div>
        </header>

        {error ? <div className="boq-master-list__error">{error}</div> : null}

        {boqs.length === 0 ? (
          <div className="boq-master-list__empty">
            <p className="text-base font-medium text-foreground">No BOQs yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Import an Excel BOQ — it will appear here with import date, owner, and publish
              progress.
            </p>
            <Button asChild className="mt-6" size="sm">
              <Link href="/boq/import">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Import BOQ
              </Link>
            </Button>
          </div>
        ) : (
          <div className="boq-master-list__card">
            <FilterableDataGrid
              pageKey="boq-master-list"
              columns={gridColumns}
              data={boqs}
              getRowKey={(boq) => String(boq.id)}
              emptyMessage="No BOQs match the current filters."
              toolbarAfterSearch={
                <BoqSettingsToolbarButton onClick={() => setSettingsOpen(true)} />
              }
              shellClassName="border-0 bg-transparent shadow-none"
              initialGroupField="projectName"
              renderGroupHeader={({ block, expanded, toggle }) => (
                <BoqProjectGroupHeader block={block} expanded={expanded} toggle={toggle} />
              )}
              aria-label="BOQ master list"
            />
          </div>
        )}
      </div>
  );

  return (
    <ShellContent className="boq-master-list">
      {content}
      <BoqSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ShellContent>
  );
}
