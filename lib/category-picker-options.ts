import type { LevelOptionEntity } from '@/domain/classification/entities';
import { buildMaterialClassificationTreeIndex } from '@/domain/classification/tree-index';
import {
  buildCatalogTagContext,
  filterDirectTagsForNode,
  filterInheritedTagsForNode,
  isCatalogTagName,
  normalizeTagLabel,
  type CatalogTagContext,
} from '@/lib/category-tag-display';
import { matchesTagFilter } from '@/lib/category-tree-filter';

export type CategoryPickerMaterialTag = {
  materialNodeId: number;
  tagName: string;
};

export type CategoryPickerOption = {
  id: number;
  label: string;
  /** Optional override for picker UI display; defaults to `label`. */
  pickerLabel?: string;
  path: string;
  depth: number;
  parentId: number | null;
  parentLabel: string | null;
  /** Direct and inherited tags — used for tag filtering. */
  tagNames: string[];
  /** Tags assigned directly on this category — used for filter tag counts. */
  directTagNames: string[];
  searchText: string;
};

function normalizeTagNames(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = String(raw ?? '')
      .trim()
      .replace(/^#+/, '');
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

function isValidPickerDirectTag(
  tagName: string,
  nodeName: string,
  catalogCtx: CatalogTagContext,
): boolean {
  const direct = filterDirectTagsForNode([tagName], nodeName);
  if (!direct.length) return false;
  const key = normalizeTagLabel(tagName).toLowerCase();
  const nonSelfCount = catalogCtx.nonSelfCountByTagLower.get(key) ?? 0;
  return isCatalogTagName(
    tagName,
    catalogCtx.categoryNamesLower,
    nonSelfCount,
    catalogCtx.rootCategoryNamesLower,
    catalogCtx.categoryTokens,
  );
}

function filterValidPickerDirectTags(
  tags: string[],
  nodeName: string,
  catalogCtx: CatalogTagContext,
): string[] {
  return normalizeTagNames(tags).filter((tag) =>
    isValidPickerDirectTag(tag, nodeName, catalogCtx),
  );
}

function buildTagNamesByNodeId(
  treeIndex: ReturnType<typeof buildMaterialClassificationTreeIndex>,
  nodes: LevelOptionEntity[],
  materialTags: CategoryPickerMaterialTag[],
): { tagNamesByNodeId: Map<number, string[]>; directTagNamesByNodeId: Map<number, string[]> } {
  const schemaId = nodes[0]?.schemaId ?? 1;
  const catalogCtx = buildCatalogTagContext(
    nodes.map((node) => ({
      id: node.id,
      name: node.name,
      schemaId: node.schemaId,
      isActive: node.isActive ?? true,
      parentId: node.parentId,
    })),
    materialTags,
    schemaId,
  );

  const directTagsByNodeId = new Map<number, string[]>();
  for (const link of materialTags) {
    const bucket = directTagsByNodeId.get(link.materialNodeId) ?? [];
    bucket.push(link.tagName);
    directTagsByNodeId.set(link.materialNodeId, bucket);
  }

  const tagNamesByNodeId = new Map<number, string[]>();
  const directTagNamesByNodeId = new Map<number, string[]>();

  for (const option of treeIndex.activeOptions) {
    const direct = filterValidPickerDirectTags(
      directTagsByNodeId.get(option.id) ?? [],
      option.name,
      catalogCtx,
    );
    directTagNamesByNodeId.set(option.id, direct);

    const inheritedRows: Array<{ tag: string; sourceLabel: string }> = [];
    const path = treeIndex.pathById.get(option.id) ?? [];
    for (let index = path.length - 2; index >= 0; index -= 1) {
      const ancestor = path[index];
      for (const tag of filterValidPickerDirectTags(
        directTagsByNodeId.get(ancestor.id) ?? [],
        ancestor.name,
        catalogCtx,
      )) {
        inheritedRows.push({ tag, sourceLabel: ancestor.name });
      }
    }
    const inherited = filterInheritedTagsForNode(
      inheritedRows,
      option.name,
      catalogCtx.categoryNamesLower,
      catalogCtx.nonSelfCountByTagLower,
      catalogCtx.rootCategoryNamesLower,
      catalogCtx.categoryTokens,
    ).map((row) => row.tag);

    tagNamesByNodeId.set(option.id, normalizeTagNames([...direct, ...inherited]));
  }

  return { tagNamesByNodeId, directTagNamesByNodeId };
}

export function withSectionPickerLabels(
  options: CategoryPickerOption[],
): CategoryPickerOption[] {
  return options.map((option) => ({
    ...option,
    searchText: `section ${option.searchText}`,
  }));
}

export function formatCategoryParentChildLabel(
  label: string,
  parentLabel?: string | null,
): string {
  const chosen = label.trim();
  if (!chosen) return '';
  const parent = parentLabel?.trim();
  if (parent) {
    return `${parent} - ${chosen}`;
  }
  return chosen;
}

export function getCategoryPickerDisplayLabel(option: CategoryPickerOption): string {
  return option.pickerLabel ?? option.label;
}

export function buildCategoryPickerOptions(
  nodes: LevelOptionEntity[],
  materialTags: CategoryPickerMaterialTag[] = [],
): CategoryPickerOption[] {
  const treeIndex = buildMaterialClassificationTreeIndex(nodes);
  const { tagNamesByNodeId, directTagNamesByNodeId } = buildTagNamesByNodeId(
    treeIndex,
    nodes,
    materialTags,
  );

  return treeIndex.activeOptions.map((node) => {
    const path = treeIndex.pathById.get(node.id) ?? [node];
    const pathLabel = treeIndex.pathLabelById.get(node.id) ?? node.name;
    const depth = path.length - 1;
    const parentEntity = path.length >= 2 ? path[path.length - 2] : null;
    const tagNames = tagNamesByNodeId.get(node.id) ?? [];
    const directTagNames = directTagNamesByNodeId.get(node.id) ?? [];

    return {
      id: node.id,
      label: node.name,
      path: pathLabel,
      depth,
      parentId: parentEntity?.id ?? null,
      parentLabel: parentEntity?.name ?? null,
      tagNames,
      directTagNames,
      searchText: `${node.name} ${pathLabel} ${tagNames.join(' ')}`.trim().toLowerCase(),
    };
  });
}

export function collectCategoryPickerAvailableTags(
  options: CategoryPickerOption[],
): Array<{ name: string; count: number }> {
  const counts = new Map<string, { name: string; count: number }>();

  for (const option of options) {
    for (const tag of option.directTagNames) {
      const key = tag.toLowerCase();
      const current = counts.get(key);
      counts.set(key, {
        name: current?.name ?? tag,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return Array.from(counts.values()).sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  );
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

export function normalizeCategoryPickerTagFilter(
  tagNames: Iterable<string>,
): Set<string> {
  return new Set(
    Array.from(tagNames)
      .map((value) => value.trim().replace(/^#+/, '').toLowerCase())
      .filter(Boolean),
  );
}

export function filterCategoryPickerOptions(
  options: CategoryPickerOption[],
  query: string,
  selectedTagNames: Iterable<string> = [],
): CategoryPickerOption[] {
  const normalized = query.trim().toLowerCase();
  const tagFilter = normalizeCategoryPickerTagFilter(selectedTagNames);

  return options.filter((option) => {
    const matchesQuery = !normalized || option.searchText.includes(normalized);
    const matchesTags = matchesTagFilter(tagFilter, option.tagNames);
    return matchesQuery && matchesTags;
  });
}
