import { PivotData, aggregators } from "react-pivottable/Utilities";
import type { TableInput } from "react-pivottable";

import type {
  PivotCellValue,
  PivotEngineConfig,
  PivotEngineResult,
} from "@/lib/analytics/pivot-engine/types";

type PivotDataConstructor = new (input: Record<string, unknown>) => PivotDataInstance;

type PivotDataInstance = PivotData & {
  getRowKeys(): string[][];
  getColKeys(): string[][];
  getAggregator(rowKey: string[], colKey: string[]): {
    value(): number | null;
    format(x: number): string;
  };
};

function formatKeyLabel(key: string[]): string {
  if (key.length === 0) return "";
  return key.join(" / ");
}

function readCell(
  pivot: PivotDataInstance,
  rowKey: string[],
  colKey: string[],
): PivotCellValue {
  const agg = pivot.getAggregator(rowKey, colKey);
  const raw = agg.value();
  const numeric = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  return {
    raw: numeric,
    formatted: numeric != null ? agg.format(numeric) : "—",
  };
}

/**
 * Runs react-pivottable PivotData as a headless calculation engine.
 * Never renders UI — returns a matrix for custom presentation layers.
 */
export function computePivotResult(config: PivotEngineConfig): PivotEngineResult {
  const PivotDataEngine = PivotData as unknown as PivotDataConstructor;
  const pivot = new PivotDataEngine({
    data: config.data as unknown as TableInput,
    rows: config.rows,
    cols: config.cols,
    vals: config.vals,
    aggregatorName: config.aggregatorName,
    aggregators,
    valueFilter: config.valueFilter ?? {},
    rowOrder: config.rowOrder ?? "key_a_to_z",
    colOrder: config.colOrder ?? "key_a_to_z",
  }) as PivotDataInstance;

  const rowKeys = pivot.getRowKeys();
  const colKeys = pivot.getColKeys();

  const cells = rowKeys.map((rowKey) =>
    colKeys.map((colKey) => readCell(pivot, rowKey, colKey)),
  );

  const rowTotals = rowKeys.map((rowKey) => readCell(pivot, rowKey, []));
  const colTotals = colKeys.map((colKey) => readCell(pivot, [], colKey));
  const grandTotal = readCell(pivot, [], []);

  return {
    rowKeys,
    colKeys,
    rowLabels: rowKeys.map(formatKeyLabel),
    colLabels: colKeys.map(formatKeyLabel),
    cells,
    rowTotals,
    colTotals,
    grandTotal,
  };
}
