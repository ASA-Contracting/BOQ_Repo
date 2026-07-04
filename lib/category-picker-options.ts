import type { LevelOptionEntity } from '@/domain/classification/entities';
import { buildMaterialClassificationTreeIndex } from '@/domain/classification/tree-index';

export type CategoryPickerOption = {
  id: number;
  label: string;
  /** When set, used in picker UI instead of `label` (e.g. "Section - Air Outlets"). */
  pickerLabel?: string;
  path: string;
  depth: number;
  parentId: number | null;
  parentLabel: string | null;
  searchText: string;
};

const SECTION_LABEL_PREFIX = 'Section - ';

export function formatSectionPickerLabel(label: string): string {
  return `${SECTION_LABEL_PREFIX}${label}`;
}

export function withSectionPickerLabels(
  options: CategoryPickerOption[],
): CategoryPickerOption[] {
  return options.map((option) => ({
    ...option,
    pickerLabel: formatSectionPickerLabel(option.label),
    searchText: `section ${option.searchText}`,
  }));
}

export function getCategoryPickerDisplayLabel(option: CategoryPickerOption): string {
  return option.pickerLabel ?? option.label;
}

export function buildCategoryPickerOptions(
  nodes: LevelOptionEntity[],
): CategoryPickerOption[] {
  const treeIndex = buildMaterialClassificationTreeIndex(nodes);

  return treeIndex.activeOptions.map((node) => {
    const path = treeIndex.pathById.get(node.id) ?? [node];
    const pathLabel = treeIndex.pathLabelById.get(node.id) ?? node.name;
    const depth = path.length - 1;
    const parentEntity = path.length >= 2 ? path[path.length - 2] : null;

    return {
      id: node.id,
      label: node.name,
      path: pathLabel,
      depth,
      parentId: parentEntity?.id ?? null,
      parentLabel: parentEntity?.name ?? null,
      searchText: `${node.name} ${pathLabel}`.trim().toLowerCase(),
    };
  });
}

export function resolveCategoryParentLabel(
  materialNodeId: number | null | undefined,
  options: CategoryPickerOption[],
): string | null {
  if (materialNodeId == null) return null;
  return options.find((option) => option.id === materialNodeId)?.parentLabel ?? null;
}

export function buildCategoryOptionById(
  options: CategoryPickerOption[],
): ReadonlyMap<number, CategoryPickerOption> {
  return new Map(options.map((option) => [option.id, option]));
}

export function resolveCategoryParentLabelFromMap(
  materialNodeId: number | null | undefined,
  optionById: ReadonlyMap<number, CategoryPickerOption>,
): string | null {
  if (materialNodeId == null) return null;
  return optionById.get(materialNodeId)?.parentLabel ?? null;
}

export function filterCategoryPickerOptions(
  options: CategoryPickerOption[],
  query: string,
): CategoryPickerOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }
  return options.filter((option) => option.searchText.includes(normalized));
}
