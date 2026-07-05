"use client";

import { ArrowDown, Rows3, SkipForward, Sparkles } from "lucide-react";

import { summarizeSheetRow } from "@/application/use-cases/workshop/buildExcelImportPreview";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const LAYOUT_SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground";

type ImportTableLayoutPanelProps = {
  headerRowIndex: number;
  skipRowsAfterHeader: number;
  skippedLabelRowCount: number;
  totalRowCount: number;
  headerRowOptions: string[][];
  skipRowOptions: number[];
  onHeaderRowChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSkipRowsChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
};

export function ImportTableLayoutPanel({
  headerRowIndex,
  skipRowsAfterHeader,
  skippedLabelRowCount,
  totalRowCount,
  headerRowOptions,
  skipRowOptions,
  onHeaderRowChange,
  onSkipRowsChange,
  className,
}: ImportTableLayoutPanelProps) {
  const selectedHeaderRow = headerRowOptions[headerRowIndex] ?? [];
  const dataStartRow = headerRowIndex + 1 + skipRowsAfterHeader + 1;
  const autoSkipped = Math.max(0, skippedLabelRowCount - skipRowsAfterHeader);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Rows3 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <Text size="sm" weight="semibold">
              Table layout
            </Text>
            <Text variant="muted" size="xs" className="mt-0.5 max-w-xl">
              Tell the importer where column titles live and which rows to ignore before item
              data begins.
            </Text>
          </div>
        </div>

        {autoSkipped > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-2.5 py-1 text-xs font-medium text-emerald-900">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {autoSkipped} label row{autoSkipped === 1 ? "" : "s"} auto-skipped
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="header-row-picker" className="text-foreground">
            Column header row
          </Label>
          <select
            id="header-row-picker"
            value={headerRowIndex}
            onChange={onHeaderRowChange}
            className={LAYOUT_SELECT_CLASS}
          >
            {headerRowOptions.map((row, index) => (
              <option key={index} value={index}>
                Row {index + 1}: {summarizeSheetRow(row)}
              </option>
            ))}
          </select>
          <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2">
            <Text variant="muted" size="xs" className="mb-1 block uppercase tracking-wide">
              Selected header preview
            </Text>
            <p className="truncate text-sm font-medium text-emerald-950">
              {summarizeSheetRow(selectedHeaderRow, 6)}
            </p>
          </div>
        </div>

        <div className="hidden flex-col items-center justify-center gap-1 px-2 pb-8 text-emerald-600 lg:flex">
          <ArrowDown className="h-4 w-4" aria-hidden />
          <Text variant="muted" size="xs" className="whitespace-nowrap">
            then skip
          </Text>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skip-rows-picker" className="text-foreground">
            Rows to skip after header
          </Label>
          <select
            id="skip-rows-picker"
            value={skipRowsAfterHeader}
            onChange={onSkipRowsChange}
            className={LAYOUT_SELECT_CLASS}
          >
            {skipRowOptions.map((count) => (
              <option key={count} value={count}>
                {count === 0
                  ? "None — data starts on the next row"
                  : `${count} row${count === 1 ? "" : "s"} (repeated titles, sub-headers…)`}
              </option>
            ))}
          </select>
          <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2">
            <SkipForward className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <Text variant="muted" size="xs">
              Use this for repeated Excel titles like{" "}
              <span className="font-medium text-foreground">
                BOQ # · Item Description · Unit · QTY · Unit Rate
              </span>
              . Auto-detection handles the common case; add extra skips if needed.
            </Text>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
        <LayoutStat label="Header" value={`Row ${headerRowIndex + 1}`} />
        <LayoutStat label="Skipped" value={String(skippedLabelRowCount)} />
        <LayoutStat label="Data starts" value={`Row ${dataStartRow}`} />
        <LayoutStat label="Importing" value={`${totalRowCount} rows`} highlight />
      </div>
    </div>
  );
}

function LayoutStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs",
        highlight
          ? "border-emerald-400 bg-emerald-600 font-semibold text-white"
          : "border-emerald-200 bg-white text-emerald-950",
      )}
    >
      <span className={cn(highlight ? "text-emerald-100" : "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
