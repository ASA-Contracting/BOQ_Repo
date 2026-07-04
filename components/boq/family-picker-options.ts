import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";

export type BoqFamilyOption = {
  id: number;
  name: string;
  label: string;
  referenceCode: string | null;
};

export function buildFamilyPickerOptions(tree: FamilyTreeNodeDto[]): BoqFamilyOption[] {
  const options: BoqFamilyOption[] = [];

  function walk(nodes: FamilyTreeNodeDto[], ancestors: string[]) {
    for (const node of nodes) {
      const path = [...ancestors, node.name];
      options.push({
        id: node.id,
        name: node.name,
        label: path.join(" › "),
        referenceCode: node.referenceCode,
      });
      walk(node.children, path);
    }
  }

  walk(tree, []);
  return options;
}

export function familyOptionForItem(
  options: BoqFamilyOption[],
  item: {
    familyId: number | null;
    familyLabel: string | null;
    familyPath: string | null;
  },
): BoqFamilyOption | null {
  const familyId = normalizeFamilyId(item.familyId);
  if (familyId == null) {
    if (!item.familyLabel?.trim()) return null;
    return {
      id: -1,
      name: item.familyLabel.trim(),
      label: item.familyPath?.trim() || item.familyLabel.trim(),
      referenceCode: null,
    };
  }

  return (
    options.find((option) => option.id === familyId) ?? {
      id: familyId,
      name: item.familyLabel?.trim() || `Family ${familyId}`,
      label: item.familyPath?.trim() || item.familyLabel?.trim() || `Family ${familyId}`,
      referenceCode: null,
    }
  );
}

export function normalizeFamilyId(value: number | null | undefined): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function optionsForFamilyCell(
  baseOptions: BoqFamilyOption[],
  item: {
    familyId: number | null;
    familyLabel: string | null;
    familyPath: string | null;
  },
): BoqFamilyOption[] {
  const familyId = normalizeFamilyId(item.familyId);
  if (familyId == null || baseOptions.some((option) => option.id === familyId)) {
    return baseOptions;
  }

  return [
    ...baseOptions,
    {
      id: familyId,
      name: item.familyLabel?.trim() || `Family ${familyId}`,
      label: item.familyPath?.trim() || item.familyLabel?.trim() || `Family ${familyId}`,
      referenceCode: null,
    },
  ];
}

export function formatFamilyOptionLabel(option: BoqFamilyOption | null): string {
  if (!option) return "";
  if (option.referenceCode) {
    return `${option.label} (${option.referenceCode})`;
  }
  return option.label;
}
