import type { BoqImportFieldKey } from "@/application/dto/workshop/importBoqSchema";
import type { ExcelPreviewDto } from "@/application/dto/workshop/categorizationDto";
import type { ExcelImportPreview } from "@/application/use-cases/workshop/buildExcelImportPreview";

export const WIZARD_FIELD_ORDER = [
  "item_no",
  "description",
  "unit",
  "quantity",
  "unit_price",
] as const satisfies readonly BoqImportFieldKey[];

export function excelColumnTitle(
  rawHeaders: string[],
  columnLetters: string[],
  index: number,
  resolvedHeader = "",
): string {
  const raw = rawHeaders[index]?.trim() ?? "";
  if (raw.length > 0) {
    return raw;
  }

  const resolved = resolvedHeader.trim();
  const fromSample = resolved.match(/^[A-Z]+ · (.+)$/);
  if (fromSample?.[1]) {
    return fromSample[1];
  }

  if (resolved.length > 0 && !/^Column [A-Z]+$/i.test(resolved)) {
    return resolved;
  }

  return `Column ${columnLetters[index] ?? String.fromCharCode(65 + index)}`;
}

export function fieldAssignments(
  mappingByIndex: Record<number, BoqImportFieldKey>,
  columnLetters: string[],
): Map<BoqImportFieldKey, string> {
  const assignments = new Map<BoqImportFieldKey, string>();

  for (const [indexStr, field] of Object.entries(mappingByIndex)) {
    if (field === "skip") {
      continue;
    }

    const letter = columnLetters[Number(indexStr)] ?? "?";
    assignments.set(field, letter);
  }

  return assignments;
}

export function buildColumnMappingByIndex(
  headers: string[],
  inferred: Record<string, BoqImportFieldKey>,
): Record<number, BoqImportFieldKey> {
  return Object.fromEntries(
    headers.map((header, index) => [index, inferred[header] ?? "skip"]),
  );
}

export function columnMappingFromIndex(
  headers: string[],
  mappingByIndex: Record<number, BoqImportFieldKey>,
): Record<string, BoqImportFieldKey> {
  return Object.fromEntries(
    headers.map((header, index) => [header, mappingByIndex[index] ?? "skip"]),
  );
}

export function buildImportRequestPayload(
  preview: ExcelPreviewDto,
  allRows: string[][],
  batchName: string,
  columnMappingByIndex: Record<number, BoqImportFieldKey>,
  projectOptions?: {
    projectName: string;
    discipline?: string;
    client?: string;
    boqId?: number;
    projectId?: number;
    headerRowIndex?: number;
    skipRowsAfterHeader?: number;
  },
) {
  return {
    batchName,
    sheetName: preview.sheetName,
    headers: preview.headers,
    rows: allRows,
    columnMapping: columnMappingFromIndex(preview.headers, columnMappingByIndex),
    columnMappingByIndex: Object.fromEntries(
      Object.entries(columnMappingByIndex).map(([index, field]) => [String(index), field]),
    ) as Record<string, BoqImportFieldKey>,
    projectName: projectOptions?.projectName ?? "",
    ...(projectOptions?.discipline ? { discipline: projectOptions.discipline } : {}),
    ...(projectOptions?.headerRowIndex !== undefined
      ? { headerRowIndex: projectOptions.headerRowIndex }
      : {}),
    ...(projectOptions?.skipRowsAfterHeader !== undefined
      ? { skipRowsAfterHeader: projectOptions.skipRowsAfterHeader }
      : {}),
    client: projectOptions?.client,
    boqId: projectOptions?.boqId,
    projectId: projectOptions?.projectId,
  };
}

export function mergeExcelImportPreview(
  preview: ExcelPreviewDto,
  importPreview: ExcelImportPreview,
): ExcelPreviewDto {
  return {
    ...preview,
    ...importPreview,
  };
}

export function buildMappedPreview(
  rows: string[][],
  mappingByIndex: Record<number, BoqImportFieldKey>,
  limit = 8,
) {
  const activeFields = WIZARD_FIELD_ORDER.filter((field) =>
    Object.values(mappingByIndex).includes(field),
  );

  const previewRows = rows.slice(0, limit).map((row) =>
    activeFields.map((field) => {
      const columnIndex = Number(
        Object.entries(mappingByIndex).find(([, mappedField]) => mappedField === field)?.[0],
      );
      if (Number.isNaN(columnIndex)) {
        return "";
      }
      return row[columnIndex]?.trim() ?? "";
    }),
  );

  return { activeFields, previewRows };
}
