"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { PIVOT_ICON_MAP } from "@/components/analytics/PricingPivot/constants";
import { getPivotField } from "@/lib/analytics/pivot-engine";
import { cn } from "@/lib/utils";

type FieldItemProps = {
  fieldId: string;
  onOpenFilter?: () => void;
  draggable?: boolean;
  dragId?: string;
  tone?: "explorer" | "chip";
};

export const FieldItem = memo(function FieldItem({
  fieldId,
  onOpenFilter,
  draggable = true,
  dragId,
  tone = "explorer",
}: FieldItemProps) {
  const field = getPivotField(fieldId);
  const Icon = field ? PIVOT_ICON_MAP[field.icon] : undefined;
  const label = field?.label ?? fieldId;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId ?? `explorer:${fieldId}`,
    disabled: !draggable,
    data: { fieldId, source: tone },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={onOpenFilter}
      title={field?.description ?? label}
      className={cn(
        "pi-explorer__field",
        tone === "chip" && "border border-[#e6eaf0] bg-white",
        isDragging && "pi-explorer__field--dragging",
      )}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[#94a3b8]" />
      {Icon ? <Icon className="h-3 w-3 shrink-0 text-[#64748b]" /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
});
