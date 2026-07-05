"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { BoqBreakdownDto, BoqItemRowDto } from "@/application/boq/dto";
import { BoqBreakdownGrid } from "@/components/boq/BoqBreakdownGrid";
import { BoqBreakdownHeader } from "@/components/boq/BoqBreakdownHeader";
import {
  applySectionParentLabels,
  filterBoqItemsBySummary,
  insertBoqItemRowInOrder,
  removeBoqItemRow,
  withCalculatedTotal,
  type BoqSummaryFilter,
} from "@/components/boq/boq-breakdown-utils";
import {
  buildCategoryOptionById,
  getCategoryPickerDisplayLabel,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";

import "@/styles/boq-breakdown.css";

type Props = {
  breakdown: BoqBreakdownDto;
  categoryOptions: CategoryPickerOption[];
  onOpenCategoryBuilder?: () => void;
};

export function BoqBreakdownWorkspace({
  breakdown,
  categoryOptions,
  onOpenCategoryBuilder,
}: Props) {
  const router = useRouter();
  const isApproved = breakdown.isApproved;
  const [items, setItems] = useState<BoqItemRowDto[]>(() =>
    breakdown.items.map(withCalculatedTotal),
  );
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [rowActionPending, setRowActionPending] = useState(false);
  const [workflowPending, setWorkflowPending] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState(breakdown.discipline ?? "");
  const [disciplineSaving, setDisciplineSaving] = useState(false);
  const [disciplineError, setDisciplineError] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState<BoqSummaryFilter>("all");

  const importHref = useMemo(() => {
    const params = new URLSearchParams({
      boqId: String(breakdown.id),
      projectId: String(breakdown.projectId),
      projectName: breakdown.projectName,
      boqName: breakdown.name,
    });
    return `/boq/import?${params.toString()}`;
  }, [breakdown.id, breakdown.name, breakdown.projectId, breakdown.projectName]);

  const sections = useMemo(
    () => items.filter((item) => item.isHeader).length,
    [items],
  );
  const measurable = useMemo(
    () => items.filter((item) => item.isMeasurable && !item.isHeader),
    [items],
  );
  const published = useMemo(
    () => measurable.filter((item) => item.materialNodeId != null).length,
    [measurable],
  );
  const pending = measurable.length - published;

  const categoryOptionById = useMemo(
    () => buildCategoryOptionById(categoryOptions),
    [categoryOptions],
  );

  const gridItems = useMemo(() => {
    const labeled = applySectionParentLabels(items, categoryOptionById);
    return filterBoqItemsBySummary(labeled, summaryFilter);
  }, [items, categoryOptionById, summaryFilter]);

  const handleApproveVersion = useCallback(async () => {
    if (!breakdown.versionId || isApproved) return;

    setWorkflowError(null);
    setWorkflowMessage(null);
    setWorkflowPending(true);

    try {
      const response = await fetch(
        `/api/boq/${breakdown.id}/versions/${breakdown.versionId}/approve`,
        { method: "POST" },
      );
      const json = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: { versionName: string; versionNumber: number };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "Failed to approve version");
      }

      setWorkflowMessage(`${json.data.versionName} approved`);
      router.refresh();
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Failed to approve version");
    } finally {
      setWorkflowPending(false);
    }
  }, [breakdown.id, breakdown.versionId, isApproved, router]);

  const handleDisciplineChange = useCallback(
    async (nextDiscipline: string) => {
      const previous = discipline;
      setDiscipline(nextDiscipline);
      setDisciplineError(null);

      if (!nextDiscipline) {
        return;
      }

      if (isApproved) {
        setDiscipline(previous);
        setDisciplineError("Discipline is locked on approved versions.");
        return;
      }

      if (!breakdown.versionId) {
        setDiscipline(previous);
        setDisciplineError("No version is available to save discipline.");
        return;
      }

      setDisciplineSaving(true);
      try {
        const response = await fetch(`/api/boq/${breakdown.id}/discipline`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            versionId: breakdown.versionId,
            ...(breakdown.batchId != null ? { batchId: breakdown.batchId } : {}),
            discipline: nextDiscipline,
          }),
        });
        const json = (await response.json()) as { success: boolean; message?: string };
        if (!response.ok || !json.success) {
          throw new Error(json.message ?? "Failed to save discipline");
        }
      } catch (error) {
        setDiscipline(previous);
        setDisciplineError(error instanceof Error ? error.message : "Failed to save discipline");
      } finally {
        setDisciplineSaving(false);
      }
    },
    [breakdown.batchId, breakdown.id, breakdown.versionId, discipline, isApproved],
  );

  const handleSelectVersion = useCallback(
    (versionId: number) => {
      if (versionId === breakdown.versionId) return;
      router.push(`/boq/${breakdown.id}?versionId=${versionId}`);
    },
    [breakdown.id, breakdown.versionId, router],
  );

  const handleDuplicateVersion = useCallback(async () => {
    if (!breakdown.versionId) return;

    setWorkflowError(null);
    setWorkflowMessage(null);
    setWorkflowPending(true);

    try {
      const response = await fetch(`/api/boq/${breakdown.id}/versions/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceVersionId: breakdown.versionId }),
      });
      const json = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: { versionId: number };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "Failed to duplicate version");
      }

      router.push(`/boq/${breakdown.id}?versionId=${json.data.versionId}`);
      router.refresh();
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Failed to duplicate version");
    } finally {
      setWorkflowPending(false);
    }
  }, [breakdown.id, breakdown.versionId, router]);

  const updateCategory = useCallback(
    async (itemId: number, materialNodeId: number | null) => {
      if (isApproved) return;

      setCategoryError(null);

      let previousRow: BoqItemRowDto | undefined;
      setItems((current) => {
        previousRow = current.find((item) => item.id === itemId);
        const option = materialNodeId ? categoryOptionById.get(materialNodeId) : null;
        return current.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            materialNodeId,
            categoryLabel: option ? getCategoryPickerDisplayLabel(option) : null,
            categoryPath: option?.path ?? null,
          };
        });
      });

      setSavingItemId(itemId);
      try {
        const response = await fetch(`/api/boq/items/${itemId}/category`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialNodeId }),
        });
        const json = (await response.json()) as { success: boolean; message?: string };
        if (!response.ok || !json.success) {
          throw new Error(json.message ?? "Failed to save category");
        }
      } catch (error) {
        if (previousRow) {
          setItems((current) =>
            current.map((item) => (item.id === itemId ? previousRow! : item)),
          );
        }
        setCategoryError(error instanceof Error ? error.message : "Failed to save category");
      } finally {
        setSavingItemId(null);
      }
    },
    [categoryOptionById, isApproved],
  );

  const insertRow = useCallback(
    async (relativeToItemId: number, position: "before" | "after") => {
      if (isApproved) return;

      setRowActionError(null);
      setRowActionPending(true);

      let previousItems: BoqItemRowDto[] | undefined;
      try {
        const response = await fetch(`/api/boq/${breakdown.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            relativeToItemId,
            position,
            versionId: breakdown.versionId,
          }),
        });
        const json = (await response.json()) as {
          success: boolean;
          data?: BoqItemRowDto;
          message?: string;
        };

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.message ?? "Failed to insert row");
        }

        setItems((current) => {
          previousItems = current;
          return insertBoqItemRowInOrder(current, json.data!, relativeToItemId, position);
        });
      } catch (error) {
        if (previousItems) {
          setItems(previousItems);
        }
        setRowActionError(error instanceof Error ? error.message : "Failed to insert row");
      } finally {
        setRowActionPending(false);
      }
    },
    [breakdown.id, breakdown.versionId, isApproved],
  );

  const deleteRows = useCallback(async (itemIds: number[]) => {
    if (isApproved || itemIds.length === 0) return;

    setRowActionError(null);
    setRowActionPending(true);

    let previousItems: BoqItemRowDto[] | undefined;
    try {
      for (const itemId of itemIds) {
        const response = await fetch(`/api/boq/items/${itemId}`, { method: "DELETE" });
        const json = (await response.json()) as { success: boolean; message?: string };

        if (!response.ok || !json.success) {
          throw new Error(json.message ?? "Failed to delete row");
        }
      }

      setItems((current) => {
        previousItems = current;
        return itemIds.reduce((next, itemId) => removeBoqItemRow(next, itemId), current);
      });
    } catch (error) {
      if (previousItems) {
        setItems(previousItems);
      }
      setRowActionError(error instanceof Error ? error.message : "Failed to delete row");
      throw error;
    } finally {
      setRowActionPending(false);
    }
  }, [isApproved]);

  return (
    <div className="boq-breakdown">
      <BoqBreakdownHeader
        breakdown={breakdown}
        discipline={discipline}
        disciplineSaving={disciplineSaving}
        totalRows={items.length}
        sections={sections}
        published={published}
        pending={pending}
        measurableCount={measurable.length}
        workflowPending={workflowPending}
        workflowMessage={workflowMessage}
        workflowError={workflowError}
        categoryError={categoryError}
        rowActionError={rowActionError}
        disciplineError={disciplineError}
        importHref={importHref}
        summaryFilter={summaryFilter}
        onSummaryFilterChange={setSummaryFilter}
        onDisciplineChange={(value) => void handleDisciplineChange(value)}
        onApproveVersion={() => void handleApproveVersion()}
        onDuplicateVersion={() => void handleDuplicateVersion()}
        onSelectVersion={handleSelectVersion}
        onOpenCategoryBuilder={onOpenCategoryBuilder}
      />

      <div className="boq-breakdown__grid-shell">
        <div className="boq-breakdown__card">
          <BoqBreakdownGrid
            pageKey={`boq-breakdown-${breakdown.id}-${breakdown.versionId ?? "latest"}`}
            items={gridItems}
            categoryOptions={categoryOptions}
            savingItemId={savingItemId}
            rowActionPending={rowActionPending}
            readOnly={isApproved}
            pendingUncategorized={pending}
            onCategoryChange={(itemId, materialNodeId) => void updateCategory(itemId, materialNodeId)}
            onItemsChange={setItems}
            onInsertRow={(itemId, position) => void insertRow(itemId, position)}
            onDeleteRows={(itemIds) => deleteRows(itemIds)}
          />
        </div>
      </div>
    </div>
  );
}
