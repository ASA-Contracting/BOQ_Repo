"use client";

import { Check, ChevronDown, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { BoqImportWizardFieldKey } from "@/application/dto/workshop/importBoqSchema";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<BoqImportWizardFieldKey, string> = {
  item_no: "Item number",
  description: "Description",
  unit: "Unit",
  quantity: "Quantity",
  skip: "Do not import",
};

type OptionState = "selected" | "available" | "taken" | "skip-selected";

function optionState(
  field: BoqImportWizardFieldKey,
  value: BoqImportWizardFieldKey,
  disabled: boolean,
): OptionState {
  if (value === field) {
    return field === "skip" ? "skip-selected" : "selected";
  }
  if (disabled && field !== "skip") {
    return "taken";
  }
  return "available";
}

type MappingFieldDropdownProps = {
  value: BoqImportWizardFieldKey;
  options: readonly BoqImportWizardFieldKey[];
  isOptionDisabled: (field: BoqImportWizardFieldKey) => boolean;
  onChange: (field: BoqImportWizardFieldKey) => void;
  "aria-label"?: string;
};

export function MappingFieldDropdown({
  value,
  options,
  isOptionDisabled,
  onChange,
  "aria-label": ariaLabel,
}: MappingFieldDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const triggerTone =
    value === "skip"
      ? "border-slate-400 bg-slate-100 text-slate-700"
      : "border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-400/50";

  return (
    <div ref={rootRef} className="relative w-full min-w-[11rem]">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border-2 px-2.5 text-left text-sm font-semibold shadow-xs transition-colors",
          triggerTone,
          open && "ring-2 ring-amber-500/40",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{FIELD_LABELS[value]}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-56 w-full min-w-[13rem] overflow-auto rounded-lg border-2 border-amber-300 bg-white py-1 shadow-xl"
        >
          {options.map((field) => {
            const disabled = isOptionDisabled(field);
            const state = optionState(field, value, disabled);
            const isInteractive = state === "available" || state === "selected" || state === "skip-selected";

            return (
              <li key={field} role="option" aria-selected={value === field}>
                <button
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    state === "selected" &&
                      "bg-emerald-600 font-bold text-white hover:bg-emerald-700",
                    state === "skip-selected" &&
                      "bg-slate-600 font-bold text-white hover:bg-slate-700",
                    state === "available" && "font-medium text-slate-900 hover:bg-amber-50",
                    state === "taken" &&
                      "cursor-not-allowed bg-slate-50 text-slate-400 line-through",
                  )}
                  onClick={() => {
                    if (!isInteractive) return;
                    onChange(field);
                    setOpen(false);
                  }}
                >
                  {state === "selected" || state === "skip-selected" ? (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  ) : state === "taken" ? (
                    <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {FIELD_LABELS[field]}
                    {state === "taken" ? " · already mapped" : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
