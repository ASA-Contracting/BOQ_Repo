"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { AnalyticsToolbar } from "@/components/analytics/PricingPivot/AnalyticsToolbar";
import { FilterDrawer } from "@/components/analytics/PricingPivot/FilterDrawer";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/analytics/PricingPivot/LoadingState";
import { PivotGrid } from "@/components/analytics/PricingPivot/PivotGrid";
import { PricingHeader } from "@/components/analytics/PricingPivot/PricingHeader";
import { SummaryCards } from "@/components/analytics/PricingPivot/SummaryCards";
import type { DropZoneId } from "@/components/analytics/PricingPivot/constants";
import { PIVOT_ICON_MAP } from "@/components/analytics/PricingPivot/constants";
import {
  PricingPivotProvider,
  usePricingPivotDataContext,
  usePricingPivotWorkspaceContext,
} from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { getPivotField } from "@/lib/analytics/pivot-engine";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import "@/styles/pricing-analytics-workspace.css";

const FieldExplorer = dynamic(
  () =>
    import("@/components/analytics/PricingPivot/FieldExplorer").then((m) => ({
      default: m.FieldExplorer,
    })),
  { ssr: false },
);

const DropZonePanel = dynamic(
  () =>
    import("@/components/analytics/PricingPivot/DropZone").then((m) => ({
      default: m.DropZonePanel,
    })),
  { ssr: false },
);

function parseChipId(id: string): { zone: DropZoneId; fieldId: string } | null {
  if (!id.startsWith("chip:")) return null;
  const [, zone, ...rest] = id.split(":");
  if (!zone || rest.length === 0) return null;
  return { zone: zone as DropZoneId, fieldId: rest.join(":") };
}

function FilterDrawerHost() {
  const { ui } = usePricingPivotWorkspaceContext();
  if (!ui.filterField) {
    return null;
  }
  return <FilterDrawer />;
}

function PricingPivotWorkspace() {
  const { fetchState, reload, rowCount } = usePricingPivotDataContext();
  const {
    workspace,
    setZoneFields,
    addFieldToZone,
    removeFieldFromZone,
    setFilterField,
    saveCurrentView,
  } = usePricingPivotWorkspaceContext();

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const fieldId = String(event.active.data.current?.fieldId ?? "");
    if (fieldId) setActiveFieldId(fieldId);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveFieldId(null);
      const { active, over } = event;
      if (!over) return;

      const fieldId = String(active.data.current?.fieldId ?? "");
      if (!fieldId) return;

      const fromChip = parseChipId(String(active.id));
      const overZone = String(over.id).startsWith("zone:")
        ? (String(over.id).replace("zone:", "") as DropZoneId)
        : parseChipId(String(over.id))?.zone;

      if (
        fromChip &&
        overZone &&
        fromChip.zone === overZone &&
        String(active.id) !== String(over.id)
      ) {
        const list =
          fromChip.zone === "rows"
            ? workspace.rows
            : fromChip.zone === "cols"
              ? workspace.cols
              : workspace.vals;
        const oldIndex = list.indexOf(fromChip.fieldId);
        const newIndex = list.indexOf(parseChipId(String(over.id))?.fieldId ?? "");
        if (oldIndex >= 0 && newIndex >= 0) {
          setZoneFields(fromChip.zone, arrayMove(list, oldIndex, newIndex));
        }
        return;
      }

      if (overZone && overZone !== "filters") {
        if (fromChip) removeFieldFromZone(fromChip.zone, fieldId);
        addFieldToZone(overZone, fieldId);
        return;
      }

      if (overZone === "filters") {
        setFilterField(fieldId);
      }
    },
    [
      addFieldToZone,
      removeFieldFromZone,
      setFilterField,
      setZoneFields,
      workspace.cols,
      workspace.rows,
      workspace.vals,
    ],
  );

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    return (
      <div className="pricing-analytics-workspace">
        <LoadingState />
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="pricing-analytics-workspace">
        <ErrorState message={fetchState.message} onRetry={reload} />
      </div>
    );
  }

  if (rowCount === 0 && fetchState.status === "success") {
    return (
      <div className="pricing-analytics-workspace">
        <EmptyState />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="pricing-analytics-workspace">
        <PricingHeader />
        <SummaryCards />
        <AnalyticsToolbar onSaveView={() => setSaveDialogOpen(true)} />

        <div className="pi-body">
          <FieldExplorer onOpenFilter={setFilterField} />

          <div className="pi-table-column">
            <DropZonePanel
              rows={workspace.rows}
              cols={workspace.cols}
              vals={workspace.vals}
              onRemoveField={removeFieldFromZone}
              onOpenFilter={setFilterField}
            />
            <PivotGrid />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 120, easing: "ease-out" }}>
        {activeFieldId ? (() => {
          const field = getPivotField(activeFieldId);
          const Icon = field ? PIVOT_ICON_MAP[field.icon] : undefined;
          return (
            <div className="pi-chip pi-chip--rows shadow-md">
              {Icon ? <Icon className="h-3 w-3" /> : null}
              <span>{field?.label ?? activeFieldId}</span>
            </div>
          );
        })() : null}
      </DragOverlay>

      <FilterDrawerHost />

      {saveDialogOpen ? (
        <Dialog
          open
          onClose={() => setSaveDialogOpen(false)}
          title="Save pivot view"
          description="Store the current rows, columns, values, filters, and aggregation."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  saveCurrentView(viewName);
                  setViewName("");
                  setSaveDialogOpen(false);
                }}
              >
                Save view
              </Button>
            </div>
          }
        >
          <Input
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            placeholder="View name"
            autoFocus
          />
        </Dialog>
      ) : null}
    </DndContext>
  );
}

export function PricingPivot() {
  return (
    <PricingPivotProvider>
      <PricingPivotWorkspace />
    </PricingPivotProvider>
  );
}
