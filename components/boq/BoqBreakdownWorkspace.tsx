"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Layers, Upload } from "lucide-react";

import type { BoqBreakdownDto, BoqItemRowDto } from "@/application/boq/dto";
import { BoqBreakdownGrid } from "@/components/boq/BoqBreakdownGrid";
import {
  applySectionParentLabels,
  insertBoqItemRowInOrder,
  removeBoqItemRow,
  withCalculatedTotal,
} from "@/components/boq/boq-breakdown-utils";
import { Select, SelectOption } from "@/components/ui/select";
import { useBoqLookupOptions } from "@/hooks/use-boq-lookup-options";
import {
  buildCategoryOptionById,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";
import { cn } from "@/lib/utils";

import "@/styles/boq-breakdown.css";

type Props = {
  breakdown: BoqBreakdownDto;
  categoryOptions: CategoryPickerOption[];
  onOpenCategoryBuilder?: () => void;
};

function isWorkshopIncomplete(breakdown: BoqBreakdownDto): boolean {
  if (!breakdown.batchId) return false;
  const measurable = breakdown.items.filter((item) => item.isMeasurable && !item.isHeader);
  const published = measurable.filter((item) => item.materialNodeId != null).length;
  return published < measurable.length;
}

export function BoqBreakdownWorkspace({
  breakdown,
  categoryOptions,
  onOpenCategoryBuilder,
}: Props) {
  const [items, setItems] = useState<BoqItemRowDto[]>(() =>
    breakdown.items.map(withCalculatedTotal),
  );
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [rowActionPending, setRowActionPending] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState(breakdown.discipline ?? "");
  const { items: disciplineOptions, loading: disciplineLoading } = useBoqLookupOptions("discipline");
  const disciplineChoices = useMemo(() => {
    if (!discipline || disciplineOptions.some((option) => option.name === discipline)) {
      return disciplineOptions;
    }
    return [{ id: -1, name: discipline, category: "discipline" as const }, ...disciplineOptions];
  }, [discipline, disciplineOptions]);

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
  const showWorkshopCta = isWorkshopIncomplete(breakdown);

  const categoryOptionById = useMemo(
    () => buildCategoryOptionById(categoryOptions),
    [categoryOptions],
  );

  const gridItems = useMemo(
    () => applySectionParentLabels(items, categoryOptionById),
    [items, categoryOptionById],
  );

  const updateCategory = useCallback(
    async (itemId: number, materialNodeId: number | null) => {
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
            categoryLabel: option?.label ?? null,
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
    [categoryOptionById],
  );

  const insertRow = useCallback(
    async (relativeToItemId: number, position: "before" | "after") => {
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
    [breakdown.id, breakdown.versionId],
  );

  const deleteRows = useCallback(async (itemIds: number[]) => {
    if (itemIds.length === 0) return;

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
  }, []);

  return (
    <div className="boq-breakdown">
      <header className="boq-breakdown__header">
        <div className="boq-breakdown__header-row">
          <div className="boq-breakdown__nav-group">
            <Link href="/boq" className="boq-breakdown__back-btn">
              BOQ master list
            </Link>

            <div className="boq-breakdown__discipline">
              <label
                className="boq-breakdown__discipline-label"
                htmlFor="boq-breakdown-discipline"
              >
                Discipline
              </label>
              <Select
                id="boq-breakdown-discipline"
                className="boq-breakdown__discipline-select"
                inputSize="sm"
                value={discipline}
                onChange={(event) => setDiscipline(event.target.value)}
                disabled={disciplineLoading || disciplineChoices.length === 0}
              >
                <SelectOption value="">
                  {disciplineLoading ? "Loading disciplines…" : "Select discipline…"}
                </SelectOption>
                {disciplineChoices.map((option) => (
                  <SelectOption key={option.id} value={option.name}>
                    {option.name}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>

          <div className="boq-breakdown__title-block">
            <h1 className="boq-breakdown__title">{breakdown.name}</h1>
            <p className="boq-breakdown__subtitle">
              {breakdown.projectName}
              {breakdown.versionName ? ` · ${breakdown.versionName}` : ""}
            </p>
          </div>

          <div className="boq-breakdown__stats">
            <StatChip label="Total rows" value={items.length} tone="slate" />
            <StatChip label="Sections" value={sections} tone="amber" />
            <StatChip label="Published" value={published} tone="emerald" />
            <StatChip label="Pending" value={pending} tone="rose" highlight={pending > 0} />
          </div>

          <div className="boq-breakdown__actions">
            {onOpenCategoryBuilder ? (
              <button
                type="button"
                className="boq-breakdown__action-btn"
                onClick={onOpenCategoryBuilder}
              >
                <Layers size={14} aria-hidden />
                Category builder
              </button>
            ) : null}
            {showWorkshopCta && breakdown.batchId ? (
              <Link
                href={`/workshop/categorize/${breakdown.batchId}`}
                className="boq-breakdown__action-btn boq-breakdown__action-btn--primary"
              >
                <ExternalLink size={14} aria-hidden />
                Continue in Workshop
              </Link>
            ) : null}
            <Link href="/boq/import" className="boq-breakdown__action-btn">
              <Upload size={14} aria-hidden />
              Import Excel
            </Link>
          </div>
        </div>

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

      <div className="boq-breakdown__grid-shell">
        <div className="boq-breakdown__card">
          <BoqBreakdownGrid
            pageKey={`boq-breakdown-${breakdown.id}`}
            items={gridItems}
            categoryOptions={categoryOptions}
            savingItemId={savingItemId}
            rowActionPending={rowActionPending}
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

function StatChip({
  label,
  value,
  tone,
  highlight = false,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald" | "rose";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "boq-breakdown__stat",
        `boq-breakdown__stat--${tone}`,
        highlight && "boq-breakdown__stat--highlight",
      )}
    >
      <div className="boq-breakdown__stat-label">{label}</div>
      <div className="boq-breakdown__stat-value">{value}</div>
    </div>
  );
}
