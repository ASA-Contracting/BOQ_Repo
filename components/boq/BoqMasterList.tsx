"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Briefcase, Plus } from "lucide-react";

import type { BoqListEntryDto } from "@/application/boq/dto";
import {
  BoqImportCell,
  BoqNameCell,
  BoqProgressCell,
  BoqProjectGroupHeader,
  BoqRowAction,
  BoqStatusCell,
  BmlBadge,
  PUBLISH_BADGE,
  approvalLabel,
  formatBoqDate,
  versionLabel,
  workflowLabel,
} from "@/components/boq/boq-master-list-cells";
import { BoqBulkDeleteDialog } from "@/components/boq/BoqBulkDeleteDialog";
import { BoqSettingsModal, BoqSettingsToolbarButton } from "@/components/boq/BoqSettingsModal";
import {
  FilterableDataGrid,
  type FilterableColumn,
} from "@/components/filter-engine";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { useGridRowSelection } from "@/hooks/use-grid-row-selection";

import "@/styles/boq-master-list.css";

type Props = {
  boqs: BoqListEntryDto[];
  error?: string | null;
  onOpenProjects?: () => void;
};

function buildGridColumns(): FilterableColumn<BoqListEntryDto>[] {
  return [
    {
      id: "scope",
      field: "scopeLabel",
      label: "Scope",
      filterType: "text",
      searchable: true,
      filterOnly: true,
      hideFromChooser: true,
      getValue: (boq) => boq.scopeLabel,
      header: "Scope",
      className: "min-w-[8rem]",
      cell: () => null,
    },
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
        <div className="bml-cell-primary bml-version-cell">
          <span>{versionLabel(boq) || "—"}</span>
          <BmlBadge tone={boq.approvalStatus === "approved" ? "green" : "yellow"}>
            {approvalLabel(boq)}
          </BmlBadge>
        </div>
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
      cell: (boq) => (
        <BmlBadge tone={boq.approvalStatus === "approved" ? "green" : "yellow"}>
          {approvalLabel(boq)}
        </BmlBadge>
      ),
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
      getValue: (boq) => boq.importedByName ?? "Unknown",
      header: "Imported by",
      className: "min-w-[8rem]",
      cell: (boq) => (
        <div className="bml-cell-primary">{boq.importedByName ?? "Unknown"}</div>
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
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const rowSelection = useGridRowSelection();
  const gridColumns = useMemo(() => buildGridColumns(), []);

  const selectedBoqs = useMemo(() => {
    return boqs.filter((boq) => rowSelection.selectedKeys.has(String(boq.id)));
  }, [boqs, rowSelection.selectedKeys]);

  const handleCopyRows = useCallback(async () => {
    if (selectedBoqs.length === 0) return;
    const lines = selectedBoqs.map((boq) =>
      [
        boq.projectName,
        boq.discipline ?? "—",
        boq.name,
        versionLabel(boq) || "—",
        workflowLabel(boq),
        approvalLabel(boq),
        `${boq.categorizedCount}/${boq.measurableCount}`,
        formatBoqDate(boq.importedAt),
      ].join("\t"),
    );
    await navigator.clipboard.writeText(lines.join("\n"));
    setStatusMessage("Copied");
  }, [selectedBoqs]);

  const handleCopyJson = useCallback(async () => {
    if (selectedBoqs.length === 0) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedBoqs, null, 2));
    setStatusMessage("JSON copied");
  }, [selectedBoqs]);

  const getRowSelectionNumber = useCallback((_boq: BoqListEntryDto, displayIndex: number) => {
    return displayIndex + 1;
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const versionIds = selectedBoqs.map((boq) => boq.versionId);
    const response = await fetch("/api/boq/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionIds }),
    });

    const payload = (await response.json()) as {
      success?: boolean;
      message?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Unable to delete selected BOQs.");
    }

    rowSelection.recordSelectionUndo("Previous selection restored");
    rowSelection.clear();
    setStatusMessage(
      versionIds.length === 1 ? "BOQ deleted" : `${versionIds.length} BOQs deleted`,
    );
    router.refresh();
  }, [router, rowSelection, selectedBoqs]);

  const handleOpenDeleteDialog = useCallback(() => {
    if (selectedBoqs.length === 0) return;
    setDeleteDialogOpen(true);
  }, [selectedBoqs.length]);

  return (
    <ShellContent flush className="boq-master-list">
      <header className="boq-master-list__header">
        <div className="boq-master-list__heading">
          <h1 className="boq-master-list__title">BOQ master list</h1>
          <p className="boq-master-list__subtitle">
            Production bills of quantities. Open a BOQ to assign categories and review the full
            breakdown grid.
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
        <div className="boq-master-list__grid-shell">
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
              shellClassName="border-0 bg-transparent shadow-none min-h-0 flex-1"
              initialHiddenColumnIds={["status"]}
              renderGroupHeader={({ block, expanded, toggle }) => (
                <BoqProjectGroupHeader block={block} expanded={expanded} toggle={toggle} />
              )}
              aria-label="BOQ master list"
              selectable
              rowSelection={rowSelection}
              getRowSelectionNumber={getRowSelectionNumber}
              selectionActionBar={{
                statusMessage,
                showEditAction: false,
                showExportAction: false,
                onCopy: () => void handleCopyRows(),
                onCopyJson: () => void handleCopyJson(),
                onDelete: handleOpenDeleteDialog,
              }}
            />
          </div>
        </div>
      )}
      <BoqSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BoqBulkDeleteDialog
        open={deleteDialogOpen}
        count={selectedBoqs.length}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />
    </ShellContent>
  );
}
