import type { BoqImportFieldKey } from "@/application/dto/workshop/importBoqSchema";

const HEADER_ALIASES: Record<BoqImportFieldKey, string[]> = {
  description: ["description", "desc", "item description", "work item", "particulars"],
  unit: ["unit", "uom", "measure"],
  quantity: ["quantity", "qty", "q'ty", "amount"],
  item_no: ["item no", "item no.", "item number", "no", "no.", "item"],
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
  "skip",
]);

export function inferWizardColumnMapping(
  headers: string[],
): Record<string, BoqImportFieldKey> {
  const mapping = inferColumnMapping(headers);
  for (const header of headers) {
    const field = mapping[header] ?? "skip";
    mapping[header] = WIZARD_FIELDS.has(field) ? field : "skip";
  }
  return mapping;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

export function inferColumnMapping(
  headers: string[],
): Record<string, BoqImportFieldKey> {
  const mapping: Record<string, BoqImportFieldKey> = {};
  const usedFields = new Set<BoqImportFieldKey>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
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
        mapping[header] = field;
        usedFields.add(field);
        break;
      }
    }

    if (!mapping[header]) {
      mapping[header] = "skip";
    }
  }

  return mapping;
}

export function batchNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return base.slice(0, 150) || fileName.slice(0, 150);
}
