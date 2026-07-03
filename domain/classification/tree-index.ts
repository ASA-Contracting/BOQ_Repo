import type { LevelOptionEntity } from './entities';

export type MaterialClassificationTreeIndex = {
  activeOptions: LevelOptionEntity[];
  optionById: Map<number, LevelOptionEntity>;
  childrenByParentId: Map<number | null, LevelOptionEntity[]>;
  childrenCountById: Map<number | null, number>;
  pathById: Map<number, LevelOptionEntity[]>;
  pathLabelById: Map<number, string>;
  descendantIdsById: Map<number, number[]>;
  expandableNodeIds: number[];
};

export function buildMaterialClassificationTreeIndex(
  levelOptions: LevelOptionEntity[]
): MaterialClassificationTreeIndex {
  const activeOptions = levelOptions.filter((option) => option.isActive !== false);
  const optionById = new Map(activeOptions.map((option) => [option.id, option]));
  const renderableParentById = new Map<number, number | null>();
  const childrenByParentId = new Map<number | null, LevelOptionEntity[]>();

  const resolveRenderableParentId = (option: LevelOptionEntity): number | null => {
    const parentId = option.parentId;
    if (parentId == null || parentId === option.id || !optionById.has(parentId)) {
      return null;
    }

    const visited = new Set<number>([option.id]);
    let cursorId: number | null | undefined = parentId;
    let guard = 0;
    while (cursorId != null && guard < 128) {
      if (visited.has(cursorId)) {
        return cursorId === option.id ? null : parentId;
      }
      visited.add(cursorId);

      const cursor = optionById.get(cursorId);
      if (!cursor || cursor.parentId == null || !optionById.has(cursor.parentId)) {
        return parentId;
      }

      cursorId = cursor.parentId;
      guard += 1;
    }

    return guard >= 128 ? null : parentId;
  };

  for (const option of activeOptions) {
    const parentId = resolveRenderableParentId(option);
    renderableParentById.set(option.id, parentId);
    const bucket = childrenByParentId.get(parentId);
    if (bucket) {
      bucket.push(option);
      continue;
    }
    childrenByParentId.set(parentId, [option]);
  }

  for (const bucket of childrenByParentId.values()) {
    bucket.sort(
      (left, right) => left.name.localeCompare(right.name) || left.id - right.id
    );
  }

  const pathById = new Map<number, LevelOptionEntity[]>();
  const pathLabelById = new Map<number, string>();
  for (const option of activeOptions) {
    const path: LevelOptionEntity[] = [];
    const visited = new Set<number>();
    let cursor: LevelOptionEntity | undefined = option;
    let guard = 0;

    while (cursor && !visited.has(cursor.id) && guard < 128) {
      visited.add(cursor.id);
      path.unshift(cursor);
      const parentId: number | null = renderableParentById.get(cursor.id) ?? null;
      cursor = parentId == null ? undefined : optionById.get(parentId);
      guard += 1;
    }

    pathById.set(option.id, path);
    pathLabelById.set(option.id, path.map((node) => node.name).join(' / '));
  }

  const childrenCountById = new Map<number | null, number>();
  for (const [parentId, children] of childrenByParentId) {
    childrenCountById.set(parentId, children.length);
  }

  const descendantIdsById = new Map<number, number[]>();
  const collectDescendants = (nodeId: number, ancestors = new Set<number>()): number[] => {
    const cached = descendantIdsById.get(nodeId);
    if (cached) {
      return cached;
    }
    if (ancestors.has(nodeId)) {
      descendantIdsById.set(nodeId, []);
      return [];
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(nodeId);
    const descendants = (childrenByParentId.get(nodeId) ?? []).flatMap((child) => [
      child.id,
      ...collectDescendants(child.id, nextAncestors),
    ]);
    descendantIdsById.set(nodeId, descendants);
    return descendants;
  };
  for (const option of activeOptions) {
    collectDescendants(option.id);
  }

  const expandableNodeIds = activeOptions
    .filter((option) => (childrenCountById.get(option.id) ?? 0) > 0)
    .map((option) => option.id);

  return {
    activeOptions,
    optionById,
    childrenByParentId,
    childrenCountById,
    pathById,
    pathLabelById,
    descendantIdsById,
    expandableNodeIds,
  };
}

export function getNodePathLength(
  nodeId: number,
  treeIndex: MaterialClassificationTreeIndex
): number {
  return (treeIndex.pathById.get(nodeId) ?? []).length;
}
