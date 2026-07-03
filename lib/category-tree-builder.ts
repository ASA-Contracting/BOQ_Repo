import type { ClassificationStateDto } from '@/application/classification/dto';
import { getExpectedChildLevelTypeId } from '@/domain/classification/classification-policy';
import {
  buildMaterialClassificationTreeIndex,
  getNodePathLength,
  type MaterialClassificationTreeIndex,
} from '@/domain/classification/tree-index';
import type { LevelOrderEntity } from '@/domain/classification/entities';
import {
  getTreeFilterSelectedModes,
  matchesModeFilter,
  matchesTagFilter,
  type CategoryTreeFilter,
} from './category-tree-filter';

export type CategoryTreeTagBadge = {
  label: string;
  inherited?: boolean;
  overflow?: boolean;
  parentContext?: boolean;
  title?: string | null;
};

export type CategoryExplorerTreeNode = {
  id: number | 'root';
  label: string;
  meta?: string | null;
  tags?: CategoryTreeTagBadge[];
  matchesSearch?: boolean;
  count?: number | null;
  recordCount?: number | null;
  priceRecordCount?: number | null;
  selected?: boolean;
  isRoot?: boolean;
  expanded?: boolean;
  canToggle?: boolean;
  tooltip?: string | null;
  showActions?: boolean;
  canAdd?: boolean;
  canRename?: boolean;
  canDelete?: boolean;
  inlineMode?: 'create' | 'rename' | null;
  inlineValue?: string | null;
  inlineError?: string | null;
  inlinePlaceholder?: string | null;
  dragging?: boolean;
  dropTarget?: boolean;
  dropBlocked?: boolean;
  children: CategoryExplorerTreeNode[];
};

export type CategoryInlineState = {
  parentId: number | null;
  nodeId: number | null;
  mode: 'create' | 'rename';
  value: string;
  error: string;
} | null;

export type BuildCategoryTreeParams = {
  state: ClassificationStateDto;
  schemaId: number;
  chainSteps: LevelOrderEntity[];
  search: string;
  filter: CategoryTreeFilter;
  tagFilterNames: Set<string>;
  expandedIds: Set<number>;
  selectedId: number | null;
  selectedIds: Set<number>;
  inline: CategoryInlineState;
  dragSourceIds?: number[];
  dropTargetId?: number | null;
  dropTargetInvalid?: boolean;
};

type NodeContext = {
  treeIndex: MaterialClassificationTreeIndex;
  summaryById: Map<number, ClassificationStateDto['nodeSummaries'][number]>;
  directTagsByNodeId: Map<number, string[]>;
  inheritedTagsByNodeId: Map<number, Array<{ tag: string; sourceLabel: string }>>;
  searchTagsByNodeId: Map<number, string[]>;
  tagBadgesByNodeId: Map<number, CategoryTreeTagBadge[]>;
  selectedFilterModes: ReturnType<typeof getTreeFilterSelectedModes>;
  query: string;
  tagFilterNames: Set<string>;
  expandedIds: Set<number>;
  selectedId: number | null;
  selectedIds: Set<number>;
  inline: CategoryInlineState;
  dragSourceIds: number[];
  dropTargetId: number | null;
  dropTargetInvalid: boolean;
  chainSteps: LevelOrderEntity[];
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

function buildTagContext(
  state: ClassificationStateDto,
  treeIndex: MaterialClassificationTreeIndex
): Pick<
  NodeContext,
  | 'directTagsByNodeId'
  | 'inheritedTagsByNodeId'
  | 'searchTagsByNodeId'
  | 'tagBadgesByNodeId'
> {
  const directTagsByNodeId = new Map<number, string[]>();
  for (const link of state.materialTags) {
    const bucket = directTagsByNodeId.get(link.materialNodeId) ?? [];
    bucket.push(link.tagName);
    directTagsByNodeId.set(link.materialNodeId, bucket);
  }

  const inheritedTagsByNodeId = new Map<
    number,
    Array<{ tag: string; sourceLabel: string }>
  >();
  const searchTagsByNodeId = new Map<number, string[]>();
  const tagBadgesByNodeId = new Map<number, CategoryTreeTagBadge[]>();

  for (const option of treeIndex.activeOptions) {
    const direct = normalizeTagNames(directTagsByNodeId.get(option.id) ?? []);
    const inheritedRows: Array<{ tag: string; sourceLabel: string }> = [];
    const path = treeIndex.pathById.get(option.id) ?? [];
    for (let index = path.length - 2; index >= 0; index -= 1) {
      const ancestor = path[index];
      for (const tag of directTagsByNodeId.get(ancestor.id) ?? []) {
        inheritedRows.push({ tag, sourceLabel: ancestor.name });
      }
    }
    inheritedTagsByNodeId.set(option.id, inheritedRows);

    const parentNameForSearch =
      path.length >= 2 ? (path[path.length - 2]?.name?.trim() ?? '') : '';
    const searchTags = normalizeTagNames([
      ...direct,
      ...inheritedRows.map((row) => row.tag),
      ...(parentNameForSearch ? [parentNameForSearch] : []),
    ]);
    searchTagsByNodeId.set(option.id, searchTags);

    const directBadges = direct.map((tag) => ({
      label: tag,
      inherited: false,
      title: 'Direct tag',
    }));
    const directLabels = new Set(direct.map((tag) => tag.toLowerCase()));
    const inheritedBadges = inheritedRows
      .filter((row) => !directLabels.has(row.tag.toLowerCase()))
      .map((row) => ({
        label: row.tag,
        inherited: true,
        title: `Inherited from ${row.sourceLabel}`,
      }));

    const parentContextBadges: CategoryTreeTagBadge[] = [];
    if (path.length >= 2) {
      const parentName = path[path.length - 2]?.name?.trim();
      if (parentName) {
        parentContextBadges.push({
          label: parentName,
          inherited: true,
          parentContext: true,
          title: 'Parent category',
        });
      }
    }

    const all = [...directBadges, ...inheritedBadges, ...parentContextBadges];
    const badges: CategoryTreeTagBadge[] = all.slice(0, 2);
    const overflow = all.slice(2);
    if (overflow.length) {
      badges.push({
        label: `+${overflow.length}`,
        overflow: true,
        inherited: overflow.every((tag) => tag.inherited),
        title: overflow.map((tag) => tag.label).join(', '),
      });
    }
    tagBadgesByNodeId.set(option.id, badges);
  }

  return {
    directTagsByNodeId,
    inheritedTagsByNodeId,
    searchTagsByNodeId,
    tagBadgesByNodeId,
  };
}

function canAddChild(nodeId: number | null, ctx: NodeContext): boolean {
  if (!ctx.chainSteps.length) {
    return true;
  }
  return (
    getExpectedChildLevelTypeId(nodeId, ctx.chainSteps, (id) =>
      getNodePathLength(id, ctx.treeIndex)
    ) != null
  );
}

function buildNode(
  nodeId: number,
  ctx: NodeContext
): CategoryExplorerTreeNode | null {
  const node = ctx.treeIndex.optionById.get(nodeId);
  if (!node) {
    return null;
  }

  const directChildren = ctx.treeIndex.childrenByParentId.get(nodeId) ?? [];
  const children = directChildren
    .map((child) => buildNode(child.id, ctx))
    .filter((child): child is CategoryExplorerTreeNode => !!child);

  const pathLabel = ctx.treeIndex.pathLabelById.get(nodeId) ?? node.name;
  const summary = ctx.summaryById.get(nodeId);
  const materialItemCount = summary?.materialItemCount ?? 0;
  const tagNames = ctx.searchTagsByNodeId.get(nodeId) ?? [];

  const matchesSearch =
    !ctx.query ||
    node.name.toLowerCase().includes(ctx.query) ||
    pathLabel.toLowerCase().includes(ctx.query) ||
    tagNames.some((tag) => tag.toLowerCase().includes(ctx.query));

  if (ctx.query && !matchesSearch && !children.length) {
    return null;
  }

  const matchesFilter =
    matchesModeFilter(ctx.selectedFilterModes, tagNames, materialItemCount) &&
    matchesTagFilter(ctx.tagFilterNames, tagNames);

  if (!matchesFilter && !children.length) {
    return null;
  }

  const inline = ctx.inline;
  const isSelected = nodeId === ctx.selectedId || ctx.selectedIds.has(nodeId);

  return {
    id: nodeId,
    label: node.name,
    meta: node.parentId ? pathLabel : 'Top of the hierarchy',
    tags: ctx.tagBadgesByNodeId.get(nodeId),
    tooltip: pathLabel,
    matchesSearch,
    selected: isSelected,
    expanded: ctx.query ? true : ctx.expandedIds.has(nodeId),
    canAdd: canAddChild(nodeId, ctx),
    canRename: true,
    canDelete: directChildren.length === 0,
    showActions: isSelected,
    inlineMode:
      inline?.mode === 'rename' && inline.nodeId === nodeId
        ? 'rename'
        : inline?.mode === 'create' && inline.parentId === nodeId
          ? 'create'
          : null,
    inlineValue:
      inline?.nodeId === nodeId || inline?.parentId === nodeId ? inline.value : null,
    inlineError:
      inline?.nodeId === nodeId || inline?.parentId === nodeId ? inline.error : null,
    inlinePlaceholder: inline?.mode === 'create' ? 'Add category' : 'Rename this node',
    count: directChildren.length || null,
    recordCount: materialItemCount || null,
    priceRecordCount: summary?.priceRecordCount || null,
    dragging: ctx.dragSourceIds.includes(nodeId),
    dropTarget:
      ctx.dragSourceIds.length > 0 &&
      ctx.dropTargetId === nodeId &&
      !ctx.dropTargetInvalid,
    dropBlocked:
      ctx.dragSourceIds.length > 0 &&
      ctx.dropTargetId === nodeId &&
      ctx.dropTargetInvalid,
    children,
  };
}

export function buildCategoryTreeRoot(params: BuildCategoryTreeParams): CategoryExplorerTreeNode {
  const materials = params.state.materials.filter(
    (m) => m.schemaId === params.schemaId && m.isActive
  );
  const treeIndex = buildMaterialClassificationTreeIndex(
    materials.map((m) => ({
      id: m.id,
      name: m.name,
      materialLevelTypeId: m.levelTypeId,
      parentId: m.parentId,
      schemaId: m.schemaId,
      isActive: m.isActive,
    }))
  );

  const tagContext = buildTagContext(params.state, treeIndex);
  const ctx: NodeContext = {
    treeIndex,
    summaryById: new Map(params.state.nodeSummaries.map((s) => [s.materialId, s])),
    selectedFilterModes: getTreeFilterSelectedModes(params.filter),
    query: params.search.trim().toLowerCase(),
    tagFilterNames: params.tagFilterNames,
    expandedIds: params.expandedIds,
    selectedId: params.selectedId,
    selectedIds: params.selectedIds,
    inline: params.inline,
    dragSourceIds: params.dragSourceIds ?? [],
    dropTargetId: params.dropTargetId ?? null,
    dropTargetInvalid: params.dropTargetInvalid ?? false,
    chainSteps: params.chainSteps,
    ...tagContext,
  };

  const roots = treeIndex.childrenByParentId.get(null) ?? [];
  const inline = params.inline;

  return {
    id: 'root',
    label: 'Root',
    meta: 'Top of the hierarchy',
    isRoot: true,
    expanded: true,
    canAdd: canAddChild(null, ctx),
    canRename: false,
    canDelete: false,
    showActions: false,
    inlineMode: inline?.mode === 'create' && inline.parentId == null ? 'create' : null,
    inlineValue: inline?.parentId == null ? (inline?.value ?? '') : '',
    inlineError: inline?.parentId == null ? (inline?.error ?? '') : '',
    inlinePlaceholder: 'Add category',
    children: roots
      .map((node) => buildNode(node.id, ctx))
      .filter((node): node is CategoryExplorerTreeNode => !!node),
  };
}

export function collectAvailableTags(
  state: ClassificationStateDto,
  schemaId: number
): Array<{ name: string; count: number }> {
  const materials = state.materials.filter(
    (m) => m.schemaId === schemaId && m.isActive,
  );
  const treeIndex = buildMaterialClassificationTreeIndex(
    materials.map((m) => ({
      id: m.id,
      name: m.name,
      materialLevelTypeId: m.levelTypeId,
      parentId: m.parentId,
      schemaId: m.schemaId,
      isActive: m.isActive,
    })),
  );
  const { searchTagsByNodeId } = buildTagContext(state, treeIndex);
  const counts = new Map<string, { name: string; count: number }>();

  for (const option of treeIndex.activeOptions) {
    for (const tag of searchTagsByNodeId.get(option.id) ?? []) {
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

export function getExistingCategoryPaths(
  state: ClassificationStateDto,
  schemaId: number
): string[] {
  const materials = state.materials.filter((m) => m.schemaId === schemaId && m.isActive);
  const treeIndex = buildMaterialClassificationTreeIndex(
    materials.map((m) => ({
      id: m.id,
      name: m.name,
      materialLevelTypeId: m.levelTypeId,
      parentId: m.parentId,
      schemaId: m.schemaId,
      isActive: m.isActive,
    }))
  );
  return materials.map(
    (m) => treeIndex.pathLabelById.get(m.id) ?? m.name
  );
}
