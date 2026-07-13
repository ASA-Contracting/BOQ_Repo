"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Search } from "lucide-react";

import { DimensionChip } from "@/components/analytics/PricingPivot/DimensionChip";
import {
  DROP_ZONE_META,
  formatValueFieldLabel,
  type DropZoneId,
} from "@/components/analytics/PricingPivot/constants";
import { usePricingPivotWorkspaceContext } from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { getPivotField } from "@/lib/analytics/pivot-engine";
import type { PivotAggregatorId } from "@/lib/analytics/pivot-engine/types";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  zone: "rows" | "cols" | "vals" | "filters";
  fields: string[];
  aggregatorName?: PivotAggregatorId;
  onRemove: (fieldId: string) => void;
  onOpenFilter?: (fieldId: string) => void;
};

export const DropZone = memo(function DropZone({
  zone,
  fields,
  aggregatorName,
  onRemove,
  onOpenFilter,
}: DropZoneProps) {
  const meta = DROP_ZONE_META[zone];
  const { isOver, setNodeRef } = useDroppable({
    id: `zone:${zone}`,
    data: { zone },
  });

  return (
    <div
      className={cn(
        "pi-dropzone",
        zone === "rows" && "pi-dropzone--rows",
        zone === "cols" && "pi-dropzone--cols",
        zone === "vals" && "pi-dropzone--vals",
        zone === "filters" && "pi-dropzone--filters",
        isOver && "pi-dropzone--active",
      )}
    >
      <span className="pi-dropzone__label">{meta.title}</span>
      <div ref={setNodeRef} className="pi-dropzone__chips">
        {fields.length === 0 ? (
          <span className="pi-dropzone__empty">Drop here</span>
        ) : zone === "filters" ? (
          fields.map((fieldId) => (
            <DimensionChip
              key={fieldId}
              fieldId={fieldId}
              displayLabel={getPivotField(fieldId)?.label ?? fieldId}
              zone={zone}
              chipClassName={meta.chipClassName}
              onRemove={() => onRemove(fieldId)}
              onFilter={onOpenFilter ? () => onOpenFilter(fieldId) : undefined}
            />
          ))
        ) : (
          <SortableContext
            items={fields.map((field) => `chip:${zone}:${field}`)}
            strategy={horizontalListSortingStrategy}
          >
            {fields.map((fieldId) => (
              <DimensionChip
                key={fieldId}
                fieldId={fieldId}
                displayLabel={
                  zone === "vals" && aggregatorName
                    ? formatValueFieldLabel(fieldId, aggregatorName)
                    : undefined
                }
                zone={zone}
                chipClassName={meta.chipClassName}
                onRemove={() => onRemove(fieldId)}
                onFilter={onOpenFilter ? () => onOpenFilter(fieldId) : undefined}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
});

type DropZonePanelProps = {
  rows: string[];
  cols: string[];
  vals: string[];
  onRemoveField: (zone: DropZoneId, fieldId: string) => void;
  onOpenFilter: (fieldId: string) => void;
};

export function DropZonePanel({
  rows,
  cols,
  vals,
  onRemoveField,
  onOpenFilter,
}: DropZonePanelProps) {
  const { workspace, filterFields, ui, setGridSearch } = usePricingPivotWorkspaceContext();

  return (
    <div className="pi-dropzone-strip">
      <DropZone
        zone="rows"
        fields={rows}
        onRemove={(fieldId) => onRemoveField("rows", fieldId)}
        onOpenFilter={onOpenFilter}
      />
      <DropZone
        zone="cols"
        fields={cols}
        onRemove={(fieldId) => onRemoveField("cols", fieldId)}
        onOpenFilter={onOpenFilter}
      />
      <DropZone
        zone="vals"
        fields={vals}
        aggregatorName={workspace.aggregatorName}
        onRemove={(fieldId) => onRemoveField("vals", fieldId)}
      />
      <DropZone
        zone="filters"
        fields={filterFields}
        onRemove={(fieldId) => onRemoveField("filters", fieldId)}
        onOpenFilter={onOpenFilter}
      />
      <label className="pi-dropzone-strip__search">
        <Search className="pi-dropzone-strip__search-icon" />
        <input
          value={ui.gridSearch}
          onChange={(event) => setGridSearch(event.target.value)}
          placeholder="Search…"
          aria-label="Search pivot data"
        />
      </label>
    </div>
  );
}
