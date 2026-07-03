import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";
import type { Family } from "@/domain/family/Family";
import type { FamilyId } from "@/domain/family/ids";

export function buildFamilyPathMap(
  families: Family[],
): Map<number, string> {
  const byId = new Map(families.map((family) => [family.id as number, family]));
  const cache = new Map<number, string>();

  function resolvePath(id: number): string {
    const cached = cache.get(id);
    if (cached) {
      return cached;
    }

    const family = byId.get(id);
    if (!family) {
      return `Family ${id}`;
    }

    const path = family.parentId
      ? `${resolvePath(family.parentId as number)} > ${family.name}`
      : family.name;

    cache.set(id, path);
    return path;
  }

  for (const family of families) {
    resolvePath(family.id as number);
  }

  return cache;
}

export function flattenFamilyTreeWithPaths(
  tree: FamilyTreeNodeDto[],
  parentPath = "",
): Array<{ id: number; name: string; path: string }> {
  const result: Array<{ id: number; name: string; path: string }> = [];

  for (const node of tree) {
    const path = parentPath ? `${parentPath} > ${node.name}` : node.name;
    result.push({ id: node.id, name: node.name, path });
    if (node.children.length > 0) {
      result.push(...flattenFamilyTreeWithPaths(node.children, path));
    }
  }

  return result;
}

export function resolveFamilyPath(
  pathMap: Map<number, string>,
  familyId: FamilyId | number | null,
): string | null {
  if (familyId === null) {
    return null;
  }

  return pathMap.get(familyId as number) ?? null;
}
