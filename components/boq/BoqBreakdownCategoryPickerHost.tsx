"use client";

import {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
} from "react";

import type { BoqItemRowDto } from "@/application/boq/dto";
import { BoqCategoryPickerMenu } from "@/components/boq/BoqCategoryPicker";
import {
  formatSectionPickerLabel,
  getCategoryPickerDisplayLabel,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";
import { cn } from "@/lib/utils";

import { isSectionFormatRow } from "./boq-breakdown-utils";

type PickerSession = {
  itemId: number;
  anchor: HTMLElement;
};

type PickerController = {
  open: (itemId: number, anchor: HTMLElement) => void;
  close: () => void;
};

type HostContextValue = {
  openForRow: (itemId: number, anchor: HTMLElement) => void;
  isRowSaving: (itemId: number) => boolean;
};

const HostContext = createContext<HostContextValue | null>(null);

export function useBoqBreakdownCategoryPicker(): HostContextValue {
  const ctx = useContext(HostContext);
  if (!ctx) {
    throw new Error("useBoqBreakdownCategoryPicker must be used within BoqBreakdownCategoryPickerHost");
  }
  return ctx;
}

type MenuLayerProps = {
  items: BoqItemRowDto[];
  categoryOptions: CategoryPickerOption[];
  sectionPickerOptions: CategoryPickerOption[];
  onCategoryChange: (itemId: number, materialNodeId: number | null) => void;
};

const BoqBreakdownCategoryPickerMenuLayer = forwardRef<PickerController, MenuLayerProps>(
  function BoqBreakdownCategoryPickerMenuLayer(
    { items, categoryOptions, sectionPickerOptions, onCategoryChange },
    ref,
  ) {
    const [session, setSession] = useState<PickerSession | null>(null);
    const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
    const onCategoryChangeRef = useRef(onCategoryChange);
    onCategoryChangeRef.current = onCategoryChange;

    useImperativeHandle(
      ref,
      () => ({
        open: (itemId, anchor) => setSession({ itemId, anchor }),
        close: () => setSession(null),
      }),
      [],
    );

    const activeItem = session ? itemById.get(session.itemId) : undefined;
    if (!session || !activeItem) return null;

    const sectionMode = isSectionFormatRow(activeItem);
    const menuOptions = sectionMode ? sectionPickerOptions : categoryOptions;
    const inferredSectionLabel =
      sectionMode &&
      activeItem.materialNodeId == null &&
      activeItem.sectionParentLabel
        ? formatSectionPickerLabel(activeItem.sectionParentLabel)
        : null;

    return (
      <BoqCategoryPickerMenu
        anchorEl={session.anchor}
        options={menuOptions}
        value={activeItem.materialNodeId}
        displayLabel={inferredSectionLabel}
        searchPlaceholder={
          sectionMode ? "Search section categories…" : "Search categories…"
        }
        onSelect={(materialNodeId) => {
          setSession(null);
          onCategoryChangeRef.current(activeItem.id, materialNodeId);
        }}
        onClose={() => setSession(null)}
      />
    );
  },
);

type HostProps = MenuLayerProps & {
  savingItemId: number | null;
  children: ReactNode;
};

export function BoqBreakdownCategoryPickerHost({
  items,
  categoryOptions,
  sectionPickerOptions,
  savingItemId,
  onCategoryChange,
  children,
}: HostProps) {
  const pickerRef = useRef<PickerController>(null);

  const openForRow = useCallback((itemId: number, anchor: HTMLElement) => {
    pickerRef.current?.open(itemId, anchor);
  }, []);

  const isRowSaving = useCallback(
    (itemId: number) => savingItemId === itemId,
    [savingItemId],
  );

  const contextValue = useMemo(
    () => ({ openForRow, isRowSaving }),
    [openForRow, isRowSaving],
  );

  return (
    <>
      <HostContext.Provider value={contextValue}>{children}</HostContext.Provider>
      <BoqBreakdownCategoryPickerMenuLayer
        ref={pickerRef}
        items={items}
        categoryOptions={categoryOptions}
        sectionPickerOptions={sectionPickerOptions}
        onCategoryChange={onCategoryChange}
      />
    </>
  );
}

type TriggerProps = {
  item: BoqItemRowDto;
  optionById: ReadonlyMap<number, CategoryPickerOption>;
};

export function BoqBreakdownCategoryPickerTrigger({ item, optionById }: TriggerProps) {
  const { openForRow, isRowSaving } = useBoqBreakdownCategoryPicker();
  const sectionMode = isSectionFormatRow(item);
  const selected =
    item.materialNodeId != null ? optionById.get(item.materialNodeId) : undefined;
  const triggerLabel =
    selected != null
      ? sectionMode
        ? formatSectionPickerLabel(selected.label)
        : getCategoryPickerDisplayLabel(selected)
      : sectionMode && item.sectionParentLabel
        ? formatSectionPickerLabel(item.sectionParentLabel)
        : null;
  const disabled = isRowSaving(item.id);
  const placeholder = sectionMode ? "Select section…" : "Select category…";

  return (
    <div
      className={cn("bbd-category-cell", sectionMode && "bbd-category-cell--section")}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "boq-category-picker__trigger flex h-9 w-full items-center gap-1.5 rounded-md border-2 px-2.5 text-left text-xs font-semibold shadow-xs transition-colors",
          sectionMode
            ? triggerLabel
              ? "boq-category-picker__trigger--section-selected"
              : "boq-category-picker__trigger--section-empty"
            : selected
              ? "border-emerald-600 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/50"
              : "border-amber-500 bg-amber-100 text-amber-950 ring-1 ring-amber-300/60",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => openForRow(item.id, event.currentTarget)}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            sectionMode
              ? triggerLabel
                ? "text-[color-mix(in_oklab,rgb(var(--warning))_88%,black_12%)]"
                : "text-[color-mix(in_oklab,rgb(var(--warning))_70%,black_20%)]"
              : selected
                ? "text-emerald-950"
                : "text-amber-900",
          )}
        >
          {triggerLabel ?? placeholder}
        </span>
        <svg
          className={cn(
            "h-4 w-4 shrink-0",
            sectionMode
              ? "text-[color-mix(in_oklab,rgb(var(--warning))_75%,black_15%)]"
              : selected
                ? "text-emerald-700"
                : "text-amber-700",
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
