"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import { importBoqAction } from "@/app/(dashboard)/boq/import/actions";
import type { ExcelPreviewDto } from "@/application/dto/workshop/categorizationDto";
import {
  BOQ_IMPORT_REQUIRED_FIELD_KEYS,
  BOQ_IMPORT_WIZARD_FIELD_KEYS,
  type BoqImportFieldKey,
  type BoqImportWizardFieldKey,
} from "@/application/dto/workshop/importBoqSchema";
import { inferWizardColumnMapping } from "@/application/use-cases/workshop/autoColumnMapping";
import { buildExcelImportPreview } from "@/application/use-cases/workshop/buildExcelImportPreview";
import { countMeasurableImportRows } from "@/application/use-cases/workshop/mapImportRows";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/components/ui/notifications-provider";
import { Select, SelectOption } from "@/components/ui/select";
import { Text } from "@/components/ui/typography";
import { useBoqLookupOptions } from "@/hooks/use-boq-lookup-options";
import { cn } from "@/lib/utils";

import {
  buildColumnMappingByIndex,
  buildImportRequestPayload,
  buildMappedPreview,
  excelColumnTitle,
  fieldAssignments,
} from "./import-wizard-utils";
import {
  ImportWizardStep,
  RequiredFieldTracker,
  WORKSHEET_SELECT_CLASS,
} from "./ImportWizardStep";
import { ImportTableLayoutPanel } from "./ImportTableLayoutPanel";
import { MappingFieldDropdown } from "./MappingFieldDropdown";

const WIZARD_GAP = "gap-4";

const FIELD_LABELS: Record<BoqImportWizardFieldKey, string> = {
  item_no: "Item number",
  description: "Description",
  unit: "Unit",
  quantity: "Quantity",
  unit_price: "Unit price",
  skip: "Do not import",
};

type ImportWizardProps = {
  initialBatchName?: string;
  initialProjectName?: string;
  initialBoqId?: number;
  initialProjectId?: number;
};

async function parseExcelFile(file: File, sheetName?: string): Promise<ExcelPreviewDto> {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) {
    formData.append("sheetName", sheetName);
  }

  const response = await fetch("/api/boq/import/parse", {
    method: "POST",
    body: formData,
  });

  const json = (await response.json()) as {
    success: boolean;
    message?: string;
    data?: ExcelPreviewDto;
  };

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message ?? "Failed to parse Excel file");
  }

  return json.data;
}

export function ImportWizard({
  initialBatchName = "",
  initialProjectName = "",
  initialBoqId,
  initialProjectId,
}: ImportWizardProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);

  const [projectName, setProjectName] = useState(initialProjectName);
  const [batchName, setBatchName] = useState(initialBatchName);
  const [discipline, setDiscipline] = useState("");
  const { items: disciplineOptions, loading: disciplineLoading } = useBoqLookupOptions("discipline");
  const [preview, setPreview] = useState<ExcelPreviewDto | null>(null);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [parseMeta, setParseMeta] = useState<{
    sheetName: string;
    sheetNames: string[];
    detectedHeaderRowIndex: number;
  } | null>(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [skipRowsAfterHeader, setSkipRowsAfterHeader] = useState(0);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [columnMappingByIndex, setColumnMappingByIndex] = useState<
    Record<number, BoqImportFieldKey>
  >({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const applyImportLayout = useCallback(
    (
      rows: string[][],
      nextHeaderRowIndex: number,
      nextSkipRowsAfterHeader: number,
      meta: {
        sheetName: string;
        sheetNames: string[];
        detectedHeaderRowIndex: number;
      },
    ) => {
      const importPreview = buildExcelImportPreview({
        sheetRows: rows,
        headerRowIndex: nextHeaderRowIndex,
        skipRowsAfterHeader: nextSkipRowsAfterHeader,
      });
      const merged: ExcelPreviewDto = {
        sheetName: meta.sheetName,
        sheetNames: meta.sheetNames,
        sheetRows: rows,
        detectedHeaderRowIndex: meta.detectedHeaderRowIndex,
        ...importPreview,
      };

      setPreview(merged);
      setAllRows(importPreview.allRows);
      setColumnMappingByIndex(
        buildColumnMappingByIndex(
          merged.headers,
          inferWizardColumnMapping(merged.headers, merged.previewRows),
        ),
      );
    },
    [],
  );

  const applyPreviewResult = useCallback(
    (data: ExcelPreviewDto) => {
      const meta = {
        sheetName: data.sheetName,
        sheetNames: data.sheetNames,
        detectedHeaderRowIndex: data.detectedHeaderRowIndex,
      };

      setSheetRows(data.sheetRows);
      setParseMeta(meta);
      setHeaderRowIndex(data.detectedHeaderRowIndex);
      const initialSkipRows = Math.max(0, data.skippedLabelRowCount);
      setSkipRowsAfterHeader(initialSkipRows);
      applyImportLayout(
        data.sheetRows,
        data.detectedHeaderRowIndex,
        initialSkipRows,
        meta,
      );
    },
    [applyImportLayout],
  );

  const headerRowOptions = useMemo(
    () => sheetRows.slice(0, Math.min(sheetRows.length, 20)),
    [sheetRows],
  );

  const maxSkipRowsAfterHeader = useMemo(() => {
    if (sheetRows.length === 0) {
      return 0;
    }
    return Math.max(0, Math.min(10, sheetRows.length - headerRowIndex - 2));
  }, [headerRowIndex, sheetRows.length]);

  const skipRowOptions = useMemo(
    () => Array.from({ length: maxSkipRowsAfterHeader + 1 }, (_, index) => index),
    [maxSkipRowsAfterHeader],
  );

  const loadExcelFile = useCallback(
    async (file: File, sheetName?: string) => {
      setLoading(true);
      try {
        const data = await parseExcelFile(file, sheetName);
        applyPreviewResult(data);
        const skippedLabelRows =
          data.skippedLabelRowCount > 0
            ? ` (${data.skippedLabelRowCount} header label row${data.skippedLabelRowCount === 1 ? "" : "s"} skipped)`
            : "";
        notify(
          `Loaded ${data.totalRowCount} rows from "${data.sheetName}"${skippedLabelRows}`,
          "success",
        );
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse Excel file";
        notify(message, "error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applyPreviewResult, notify],
  );

  const assignments = useMemo(
    () => fieldAssignments(columnMappingByIndex, preview?.columnLetters ?? []),
    [columnMappingByIndex, preview?.columnLetters],
  );

  const hasDescriptionMapping = assignments.has("description");
  const uploadComplete = Boolean(preview && uploadedFile);
  const mappingComplete = BOQ_IMPORT_REQUIRED_FIELD_KEYS.every((field) =>
    assignments.has(field),
  );

  const requiredFieldStatus = useMemo(
    () =>
      BOQ_IMPORT_REQUIRED_FIELD_KEYS.map((field) => ({
        key: field,
        label: FIELD_LABELS[field],
        mapped: assignments.has(field),
        columnLetter: assignments.get(field),
      })),
    [assignments],
  );

  const importPayload = useMemo(() => {
    if (!preview || !batchName.trim() || !projectName.trim() || !discipline) {
      return null;
    }
    return buildImportRequestPayload(
      preview,
      allRows,
      batchName.trim(),
      columnMappingByIndex,
      {
        projectName: projectName.trim(),
        discipline,
        headerRowIndex,
        skipRowsAfterHeader,
        boqId: initialBoqId,
        projectId: initialProjectId,
      },
    );
  }, [
    allRows,
    batchName,
    columnMappingByIndex,
    discipline,
    headerRowIndex,
    initialBoqId,
    initialProjectId,
    preview,
    projectName,
    skipRowsAfterHeader,
  ]);

  const projectStepComplete =
    projectName.trim().length > 0 && batchName.trim().length > 0 && discipline.length > 0;

  const importableRowCount = useMemo(() => {
    if (!importPayload) {
      return 0;
    }
    return countMeasurableImportRows(importPayload);
  }, [importPayload]);

  const mappedPreview = useMemo(() => {
    if (!preview) {
      return null;
    }
    return buildMappedPreview(allRows, columnMappingByIndex);
  }, [allRows, columnMappingByIndex, preview]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setUploadedFile(file);
      const loaded = await loadExcelFile(file);
      if (!loaded) {
        setUploadedFile(null);
        setPreview(null);
        setSheetRows([]);
        setParseMeta(null);
        setAllRows([]);
        setColumnMappingByIndex({});
      } else if (!batchName) {
        setBatchName(file.name.replace(/\.xlsx$/i, "").replace(/\.xls$/i, ""));
      }
    },
    [batchName, loadExcelFile],
  );

  const handleSheetChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!uploadedFile) {
        return;
      }
      await loadExcelFile(uploadedFile, event.target.value);
    },
    [loadExcelFile, uploadedFile],
  );

  const handleHeaderRowChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!parseMeta) {
        return;
      }

      const nextHeaderRowIndex = Number(event.target.value);
      const nextSkipRowsAfterHeader = Math.min(
        skipRowsAfterHeader,
        Math.max(0, Math.min(10, sheetRows.length - nextHeaderRowIndex - 2)),
      );

      setHeaderRowIndex(nextHeaderRowIndex);
      setSkipRowsAfterHeader(nextSkipRowsAfterHeader);
      applyImportLayout(sheetRows, nextHeaderRowIndex, nextSkipRowsAfterHeader, parseMeta);
    },
    [applyImportLayout, parseMeta, sheetRows, skipRowsAfterHeader],
  );

  const handleSkipRowsChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!parseMeta) {
        return;
      }

      const nextSkipRowsAfterHeader = Number(event.target.value);
      setSkipRowsAfterHeader(nextSkipRowsAfterHeader);
      applyImportLayout(sheetRows, headerRowIndex, nextSkipRowsAfterHeader, parseMeta);
    },
    [applyImportLayout, headerRowIndex, parseMeta, sheetRows],
  );

  const handleMappingChange = useCallback(
    (columnIndex: number, nextField: BoqImportWizardFieldKey) => {
      setColumnMappingByIndex((current) => {
        const next = { ...current, [columnIndex]: nextField };

        if (nextField !== "skip") {
          for (const [indexStr, mappedField] of Object.entries(next)) {
            const index = Number(indexStr);
            if (index !== columnIndex && mappedField === nextField) {
              next[index] = "skip";
            }
          }
        }

        return next;
      });
    },
    [],
  );

  const isFieldOptionDisabled = useCallback(
    (field: BoqImportWizardFieldKey, columnIndex: number) => {
      if (field === "skip") {
        return false;
      }

      for (const [mappedIndex, mappedField] of Object.entries(columnMappingByIndex)) {
        if (mappedField === field && Number(mappedIndex) !== columnIndex) {
          return true;
        }
      }

      return false;
    },
    [columnMappingByIndex],
  );

  const handleImport = useCallback(async () => {
    if (!importPayload || !hasDescriptionMapping || importableRowCount === 0) {
      return;
    }

    setImporting(true);
    try {
      const result = await importBoqAction(importPayload);

      if (!result.success) {
        notify(`Import failed: ${result.error.message}`, "error");
        return;
      }

      notify(`Imported ${result.data.itemCount} items`, "success");

      if (result.data.boqId > 0) {
        router.push(`/boq/${result.data.boqId}`);
      } else {
        router.push("/boq");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Import failed", "error");
    } finally {
      setImporting(false);
    }
  }, [
    hasDescriptionMapping,
    importableRowCount,
    importPayload,
    notify,
    router,
  ]);

  useLayoutEffect(() => {
    const element = leftColumnRef.current;
    if (!element) return;

    const syncHeight = () => {
      setLeftColumnHeight(element.getBoundingClientRect().height);
    };

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(element);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [batchName, discipline, preview, projectName, uploadedFile, loading]);

  return (
    <ShellContent className="mx-auto w-full min-w-0 max-w-7xl pb-10">
      <div className="mb-4 space-y-1">
        <Text size="lg" weight="semibold">
          Import BOQ
        </Text>
        <Text variant="muted" size="sm">
          Upload an Excel file, map columns, then preview and adjust table layout before import.
        </Text>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        disabled={loading}
        onChange={handleFileChange}
      />

      <div className={cn("flex flex-col", WIZARD_GAP)}>
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 lg:items-start", WIZARD_GAP)}>
          <div ref={leftColumnRef} className={cn("flex min-h-0 flex-col", WIZARD_GAP)}>
            <ImportWizardStep
              step={1}
              tone="sky"
              title="Project & BOQ"
              description="Choose the project and name this BOQ import."
              complete={projectStepComplete}
              className="shrink-0"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="North Tower MEP"
                  />
                  <Text variant="muted" size="xs">
                    One project can have many BOQs. Reusing the same project name links this import
                    to the existing project.
                  </Text>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="batch-name">BOQ name</Label>
                    <Input
                      id="batch-name"
                      value={batchName}
                      onChange={(event) => setBatchName(event.target.value)}
                      placeholder="Electrical BOQ Rev A"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discipline">Discipline</Label>
                    <Select
                      id="discipline"
                      value={discipline}
                      onChange={(event) => setDiscipline(event.target.value)}
                      required
                      disabled={disciplineLoading || disciplineOptions.length === 0}
                    >
                      <SelectOption value="" disabled>
                        {disciplineLoading ? "Loading disciplines…" : "Select discipline…"}
                      </SelectOption>
                      {disciplineOptions.map((option) => (
                        <SelectOption key={option.id} value={option.name}>
                          {option.name}
                        </SelectOption>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </ImportWizardStep>

            <ImportWizardStep
              step={2}
              tone="sky"
              title="Upload Excel"
              description="Choose the .xlsx BOQ file."
              complete={uploadComplete}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="grid gap-2">
                  <Label>Excel file (.xlsx)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="h-auto justify-start border-sky-300 bg-white py-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    {uploadedFile ? uploadedFile.name : "Choose Excel file…"}
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Parsing Excel file…
                  </div>
                ) : null}

                {uploadedFile && preview ? (
                  <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                    {preview.totalRowCount} data rows · {preview.headers.length} columns detected
                  </div>
                ) : null}

                <div className="mt-auto grid gap-2">
                  <Label htmlFor="sheet-picker">Worksheet</Label>
                  <select
                    id="sheet-picker"
                    value={preview?.sheetName ?? ""}
                    disabled={loading || !preview}
                    onChange={handleSheetChange}
                    className={WORKSHEET_SELECT_CLASS}
                  >
                    {!preview ? (
                      <option value="">Upload a file to select worksheet…</option>
                    ) : (
                      preview.sheetNames.map((sheetName) => (
                        <option key={sheetName} value={sheetName}>
                          {sheetName}
                        </option>
                      ))
                    )}
                  </select>
                  <Text variant="muted" size="xs">
                    {preview
                      ? `${preview.sheetNames.length} worksheet${preview.sheetNames.length === 1 ? "" : "s"} in this file`
                      : "Worksheet list appears after you choose a file"}
                  </Text>
                </div>
              </div>
            </ImportWizardStep>
          </div>

          <ImportWizardStep
            step={3}
            tone="amber"
            title="Map columns"
            description="Match each Excel column to Item number, Description, Unit, Quantity, or Unit price."
            complete={mappingComplete}
            className="flex min-h-0 flex-col overflow-hidden lg:max-h-[var(--import-left-col-height)]"
            style={
              leftColumnHeight
                ? ({ "--import-left-col-height": `${leftColumnHeight}px` } as React.CSSProperties)
                : undefined
            }
          >
          {!preview ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/40 px-6 py-10 text-center">
              <Upload className="mb-3 h-8 w-8 text-amber-500" aria-hidden />
              <Text size="sm" weight="medium">
                Upload an Excel file to start mapping
              </Text>
              <Text variant="muted" size="xs" className="mt-1 max-w-xs">
                Use step 2 on the left — columns appear here once the file is loaded.
              </Text>
            </div>
          ) : (
            <>
              <RequiredFieldTracker fields={requiredFieldStatus} className="shrink-0" />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-2 border-amber-200">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-amber-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-amber-950">
                          Excel column
                        </th>
                        <th className="w-52 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-amber-950">
                          Maps to
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {preview.headers.map((header, columnIndex) => {
                        const currentField = (columnMappingByIndex[columnIndex] ??
                          "skip") as BoqImportWizardFieldKey;
                        const columnTitle = excelColumnTitle(
                          preview.rawHeaders,
                          preview.columnLetters,
                          columnIndex,
                          header,
                        );
                        const sample =
                          preview.previewRows.find(
                            (row) => (row[columnIndex] ?? "").length > 0,
                          )?.[columnIndex] ??
                          allRows.find((row) => (row[columnIndex] ?? "").length > 0)?.[
                            columnIndex
                          ] ??
                          "";

                        return (
                          <tr key={`${columnIndex}-${header}`} className="border-t border-amber-100">
                            <td className="px-3 py-2.5 align-top">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 shrink-0 rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                                  {preview.columnLetters[columnIndex]}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{columnTitle}</p>
                                  {sample ? (
                                    <p className="text-xs text-muted-foreground">
                                      Sample: {sample}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <MappingFieldDropdown
                                value={currentField}
                                options={BOQ_IMPORT_WIZARD_FIELD_KEYS}
                                isOptionDisabled={(field) =>
                                  isFieldOptionDisabled(field, columnIndex)
                                }
                                onChange={(field) => handleMappingChange(columnIndex, field)}
                                aria-label={`Map column ${columnTitle}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </ImportWizardStep>
        </div>

        {preview && mappedPreview ? (
          <ImportWizardStep
            step={4}
            tone="emerald"
            title="Preview mapped rows"
            description="Adjust table layout, then confirm the rows that will be imported."
            complete={mappingComplete && hasDescriptionMapping}
          >
            <ImportTableLayoutPanel
              headerRowIndex={headerRowIndex}
              skipRowsAfterHeader={skipRowsAfterHeader}
              skippedLabelRowCount={preview.skippedLabelRowCount}
              totalRowCount={preview.totalRowCount}
              headerRowOptions={headerRowOptions}
              skipRowOptions={skipRowOptions}
              onHeaderRowChange={handleHeaderRowChange}
              onSkipRowsChange={handleSkipRowsChange}
            />

            {mappedPreview.activeFields.length === 0 ? (
              <Text variant="muted" size="sm">
                Map at least one column above to see a preview.
              </Text>
            ) : (
              <div className="space-y-2">
                <Text size="sm" weight="semibold">
                  Mapped data preview
                </Text>
                <Text variant="muted" size="xs">
                  Only mapped system fields are shown — not every Excel column.
                </Text>
                <div className="overflow-hidden rounded-lg border-2 border-emerald-200">
                <div className="max-h-[min(18rem,35vh)] overflow-auto">
                  <table className="w-full min-w-[32rem] border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-emerald-100">
                      <tr>
                        {mappedPreview.activeFields.map((field) => (
                          <th
                            key={field}
                            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-emerald-950"
                          >
                            {FIELD_LABELS[field]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {mappedPreview.previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-emerald-100">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="max-w-xs px-4 py-2 align-top break-words"
                            >
                              {cell || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            )}

            {!hasDescriptionMapping ? (
              <p className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Map the <strong>Description</strong> column before importing.
              </p>
            ) : importableRowCount === 0 ? (
              <p className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                No importable rows with the current mapping.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-emerald-200 pt-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => void handleImport()}
                disabled={
                  !hasDescriptionMapping ||
                  importableRowCount === 0 ||
                  importing ||
                  !batchName.trim() ||
                  !discipline ||
                  loading
                }
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  "Import BOQ"
                )}
              </Button>
              <Text variant="muted" size="sm">
                {importableRowCount} measurable rows will be imported ({preview.totalRowCount}{" "}
                rows on sheet)
              </Text>
            </div>
          </ImportWizardStep>
        ) : null}
      </div>
    </ShellContent>
  );
}
