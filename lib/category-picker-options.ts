import type { LevelOptionEntity } from '@/domain/classification/entities';
import { buildMaterialClassificationTreeIndex } from '@/domain/classification/tree-index';

export type CategoryPickerOption = {
  id: number;
  label: string;
  path: string;
  depth: number;
  searchText: string;
};

export function buildCategoryPickerOptions(
  nodes: LevelOptionEntity[],
): CategoryPickerOption[] {
  const treeIndex = buildMaterialClassificationTreeIndex(nodes);

  return treeIndex.activeOptions.map((node) => {
    const path = treeIndex.pathLabelById.get(node.id) ?? node.name;
    const depth = (treeIndex.pathById.get(node.id)?.length ?? 1) - 1;
    return {
      id: node.id,
      label: node.name,
      path,
      depth,
      searchText: `${node.name} ${path}`.trim().toLowerCase(),
    };
  });
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
