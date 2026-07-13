"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Filter, X } from "lucide-react";

import { PIVOT_ICON_MAP } from "@/components/analytics/PricingPivot/constants";
import type { DropZoneId } from "@/components/analytics/PricingPivot/constants";
import { getPivotField } from "@/lib/analytics/pivot-engine";
import { cn } from "@/lib/utils";

type DimensionChipProps = {
  fieldId: string;
  displayLabel?: string;
  zone: DropZoneId;
  chipClassName?: string;
  onRemove: () => void;
  onFilter?: () => void;
};

export const DimensionChip = memo(function DimensionChip({
  fieldId,
  displayLabel,
  zone,
  chipClassName,
  onRemove,
  onFilter,
}: DimensionChipProps) {
  const field = getPivotField(fieldId);
  const Icon = field ? PIVOT_ICON_MAP[field.icon] : undefined;
  const label = displayLabel ?? field?.label ?? fieldId;

  const sortable = zone !== "filters";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chip:${zone}:${fieldId}`,
    data: { fieldId, zone, source: "chip" },
    disabled: !sortable,
  });

  const style = sortable
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined;

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={cn("pi-chip", chipClassName, isDragging && "opacity-60")}
      title={label}
    >
      {sortable ? (
        <button
          type="button"
          className="inline-flex cursor-grab items-center active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${label}`}
        >
          {Icon ? <Icon className="h-3 w-3" /> : null}
        </button>
      ) : Icon ? (
        <Icon className="h-3 w-3" />
      ) : null}
      <span>{label}</span>
      {onFilter ? (
        <button
          type="button"
          className="pi-chip__remove"
          onClick={onFilter}
          aria-label={`Filter ${label}`}
        >
          <Filter className="h-3 w-3" />
        </button>
      ) : null}
      <button
        type="button"
        className="pi-chip__remove"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});
