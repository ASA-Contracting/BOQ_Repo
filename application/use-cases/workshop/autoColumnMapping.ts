import type { BoqImportFieldKey } from "@/application/dto/workshop/importBoqSchema";

const HEADER_ALIASES: Record<BoqImportFieldKey, string[]> = {
  description: ["description", "desc", "item description", "work item", "particulars"],
  unit: ["unit", "uom", "measure"],
  quantity: ["quantity", "qty", "q'ty", "amount"],
  unit_price: ["unit price", "unit rate", "rate", "price", "unit cost", "u/p"],
  item_no: ["item no", "item no.", "item number", "boq #", "boq", "no", "no.", "item"],
  section: ["section", "division", "chapter"],
  discipline: ["discipline", "trade", "system"],
  family: ["family", "category", "classification", "family name", "family id"],
  skip: [],
};

const WIZARD_FIELDS = new Set<BoqImportFieldKey>([
  "item_no",
  "description",
  "unit",
  "quantity",
  "unit_price",
  "skip",
]);

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function isNumericCell(value: string): boolean {
  const compact = value.replace(/,/g, "").replace(/\s+/g, "");
  return /^-?\d+(?:\.\d+)?$/.test(compact);
}

function columnLabelCandidates(
  header: string,
  columnIndex: number,
  previewRows?: string[][],
): string[] {
  const candidates: string[] = [];

  const dotLabel = header.match(/^[A-Z]+ · (.+)$/);
  if (dotLabel?.[1]) {
    candidates.push(dotLabel[1]);
  }

  if (header.trim()) {
    candidates.push(header);
  }

  if (previewRows) {
    for (const row of previewRows.slice(0, 8)) {
      const cell = row[columnIndex]?.trim() ?? "";
      if (!cell || isNumericCell(cell)) {
        continue;
      }
      candidates.push(cell);
    }
  }

  return candidates;
}

function matchFieldFromLabels(
  labels: string[],
  usedFields: Set<BoqImportFieldKey>,
): BoqImportFieldKey | null {
  for (const label of labels) {
    const normalized = normalizeHeader(label);
    if (!normalized) {
      continue;
    }

    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
      [BoqImportFieldKey, string[]]
    >) {
      if (field === "skip" || usedFields.has(field)) {
        continue;
      }

      if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        return field;
      }
    }
  }

  return null;
}

export function inferWizardColumnMapping(
  headers: string[],
  previewRows?: string[][],
): Record<string, BoqImportFieldKey> {
  const mapping = inferColumnMapping(headers, previewRows);
  for (const header of headers) {
    const field = mapping[header] ?? "skip";
    mapping[header] = WIZARD_FIELDS.has(field) ? field : "skip";
  }
  return mapping;
}

export function inferColumnMapping(
  headers: string[],
  previewRows?: string[][],
): Record<string, BoqImportFieldKey> {
  const mapping: Record<string, BoqImportFieldKey> = {};
  const usedFields = new Set<BoqImportFieldKey>();

  headers.forEach((header, columnIndex) => {
    const labels = columnLabelCandidates(header, columnIndex, previewRows);
    const matched = matchFieldFromLabels(labels, usedFields);
    mapping[header] = matched ?? "skip";
    if (matched) {
      usedFields.add(matched);
    }
  });

  return mapping;
}

export function batchNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return base.slice(0, 150) || fileName.slice(0, 150);
}
