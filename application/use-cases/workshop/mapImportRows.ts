import type { ImportBoqInput } from "@/application/dto/workshop/importBoqSchema";
import { normalizeImportQuantity } from "@/application/use-cases/workshop/normalizeImportQuantity";

export type MappedImportLine = {
  rowIndex: number;
  description: string | null;
  unit: string | null;
  quantity: string | null;
  itemNo: string | null;
  isHeader: boolean;
  isMeasurable: boolean;
  contextSnapshot: Record<string, string> | null;
  familyHint: string | null;
};

function buildFieldToColumnIndex(input: ImportBoqInput): Map<string, number> {
  const fieldToIndex = new Map<string, number>();

  if (input.columnMappingByIndex) {
    for (const [indexStr, field] of Object.entries(input.columnMappingByIndex)) {
      if (field === "skip") {
        continue;
      }
      fieldToIndex.set(field, Number(indexStr));
    }
    return fieldToIndex;
  }

  const headerIndex = new Map(input.headers.map((header, index) => [header, index]));
  for (const [column, field] of Object.entries(input.columnMapping)) {
    if (field === "skip") {
      continue;
    }
    const index = headerIndex.get(column);
    if (index !== undefined) {
      fieldToIndex.set(field, index);
    }
  }

  return fieldToIndex;
}

export function mapImportRows(input: ImportBoqInput): MappedImportLine[] {
  const fieldToIndex = buildFieldToColumnIndex(input);

  const getCell = (row: string[], field: string): string => {
    const index = fieldToIndex.get(field);
    if (index === undefined) {
      return "";
    }
    return row[index]?.trim() ?? "";
  };

  const mapped = input.rows
    .map((row, index) => {
      const description = getCell(row, "description");
      const unit = getCell(row, "unit");
      const quantity = normalizeImportQuantity(getCell(row, "quantity"));
      const itemNo = getCell(row, "item_no");
      const section = getCell(row, "section");
      const rowDiscipline = getCell(row, "discipline");
      const familyHint = getCell(row, "family");

      const contextSnapshot: Record<string, string> = {};
      if (section) {
        contextSnapshot.section = section;
      }
      const discipline = rowDiscipline || input.discipline;
      if (discipline) {
        contextSnapshot.discipline = discipline;
      }

      const isHeader = description.length > 0 && !quantity && !unit;
      const isMeasurable = !isHeader;

      return {
        rowIndex: index + 1,
        description: description || null,
        unit: unit || null,
        quantity: quantity || null,
        itemNo: itemNo || null,
        isHeader,
        isMeasurable,
        contextSnapshot:
          Object.keys(contextSnapshot).length > 0 ? contextSnapshot : null,
        familyHint: familyHint || null,
      };
    })
    .filter((line) => line.description || line.itemNo);

  return applySectionInheritance(mapped);
}

/** Propagate section header rows as the inherited parent for following child rows. */
export function applySectionInheritance(lines: MappedImportLine[]): MappedImportLine[] {
  let currentSectionParent: string | null = null;

  return lines.map((line) => {
    if (line.isHeader) {
      currentSectionParent =
        line.description?.trim() ||
        line.contextSnapshot?.section?.trim() ||
        null;

      const contextSnapshot = { ...(line.contextSnapshot ?? {}) };
      if (currentSectionParent) {
        contextSnapshot.sectionParent = currentSectionParent;
        contextSnapshot.section = currentSectionParent;
      }

      return {
        ...line,
        contextSnapshot: Object.keys(contextSnapshot).length > 0 ? contextSnapshot : null,
      };
    }

    const inheritedSection = currentSectionParent ?? line.contextSnapshot?.section ?? null;
    const contextSnapshot = { ...(line.contextSnapshot ?? {}) };

    if (inheritedSection) {
      contextSnapshot.section = inheritedSection;
      contextSnapshot.sectionParent = inheritedSection;
    }

    return {
      ...line,
      contextSnapshot: Object.keys(contextSnapshot).length > 0 ? contextSnapshot : null,
    };
  });
}

export function countMeasurableImportRows(input: ImportBoqInput): number {
  return mapImportRows(input).filter((line) => line.isMeasurable).length;
}
