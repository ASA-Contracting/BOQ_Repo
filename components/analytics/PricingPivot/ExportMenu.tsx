"use client";

import { Download } from "lucide-react";

import {
  usePricingPivotDataContext,
  usePricingPivotWorkspaceContext,
} from "@/components/analytics/PricingPivot/context/PricingPivotContext";
import { exportPivotCsv } from "@/components/analytics/PricingPivot/types";

export function ExportMenu() {
  const { pivotResult } = usePricingPivotDataContext();
  const { ui } = usePricingPivotWorkspaceContext();

  const exportCsv = () => {
    if (!pivotResult) return;

    const headers = ["Row", ...pivotResult.colLabels];
    if (ui.showTotals) headers.push("Row total");

    const body = pivotResult.rowLabels.map((label, rowIndex) => {
      const cells = pivotResult.cells[rowIndex]?.map((cell) => cell.formatted) ?? [];
      if (ui.showTotals) {
        cells.push(pivotResult.rowTotals[rowIndex]?.formatted ?? "");
      }
      return [label, ...cells];
    });

    if (ui.showTotals) {
      body.push([
        "Total",
        ...pivotResult.colTotals.map((cell) => cell.formatted),
        pivotResult.grandTotal.formatted,
      ]);
    }

    exportPivotCsv(headers, body);
  };

  return (
    <button
      type="button"
      disabled={!pivotResult}
      className="pi-toolbar__btn pi-toolbar__btn--primary"
      onClick={exportCsv}
    >
      <Download className="h-3 w-3" />
      Export
    </button>
  );
}
