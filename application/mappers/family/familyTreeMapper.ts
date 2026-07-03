import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";
import type { Family } from "@/domain/family/Family";

function sortTreeNodes(nodes: FamilyTreeNodeDto[]): void {
  nodes.sort((left, right) => left.name.localeCompare(right.name));

  for (const node of nodes) {
    sortTreeNodes(node.children);
  }
}

export function mapFamiliesToTree(
  families: readonly Family[],
): FamilyTreeNodeDto[] {
  const nodes = new Map<number, FamilyTreeNodeDto>();

  for (const family of families) {
    nodes.set(family.id as number, {
      id: family.id as number,
      name: family.name,
      referenceCode: family.referenceCode,
      familyLevelTypeId: family.familyLevelTypeId as number,
      parentId: family.parentId as number | null,
      children: [],
    });
  }

  const roots: FamilyTreeNodeDto[] = [];

  for (const family of families) {
    const node = nodes.get(family.id as number);
    if (!node) {
      continue;
    }

    if (family.parentId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(family.parentId as number);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortTreeNodes(roots);
  return roots;
}
