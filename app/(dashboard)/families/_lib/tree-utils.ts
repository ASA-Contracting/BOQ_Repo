import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";

export type FamilyTreeNodeData = {
  id: number;
  name: string;
  referenceCode: string | null;
  familyLevelTypeId: number;
  parentId: number | null;
  children: FamilyTreeNodeData[];
};

export type ParentOption = {
  id: number;
  label: string;
};

export type HighlightSegment = {
  text: string;
  match: boolean;
};

export function mapTreeDto(nodes: FamilyTreeNodeDto[]): FamilyTreeNodeData[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    referenceCode: node.referenceCode,
    familyLevelTypeId: node.familyLevelTypeId,
    parentId: node.parentId,
    children: mapTreeDto(node.children),
  }));
}

export function collectAllNodeIds(nodes: FamilyTreeNodeData[]): number[] {
  return nodes.flatMap((node) => [
    node.id,
    ...collectAllNodeIds(node.children),
  ]);
}

export function flattenVisibleNodes(
  nodes: FamilyTreeNodeData[],
  expandedIds: ReadonlySet<number>,
): FamilyTreeNodeData[] {
  const visible: FamilyTreeNodeData[] = [];

  function visit(node: FamilyTreeNodeData) {
    visible.push(node);
    if (expandedIds.has(node.id)) {
      node.children.forEach(visit);
    }
  }

  nodes.forEach(visit);
  return visible;
}

export function findPathToNode(
  nodes: FamilyTreeNodeData[],
  targetId: number,
  trail: number[] = [],
): number[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node.id];
    if (node.id === targetId) {
      return nextTrail;
    }

    const childPath = findPathToNode(node.children, targetId, nextTrail);
    if (childPath) {
      return childPath;
    }
  }

  return null;
}

export function buildParentOptions(
  nodes: FamilyTreeNodeData[],
  excludeId?: number,
  level = 0,
): ParentOption[] {
  return nodes.flatMap((node) => {
    const prefix = level > 0 ? `${"  ".repeat(level)}` : "";
    const current =
      node.id === excludeId
        ? []
        : [{ id: node.id, label: `${prefix}${node.name}` }];

    return [...current, ...buildParentOptions(node.children, excludeId, level + 1)];
  });
}

export function splitHighlightText(
  text: string,
  query: string,
): HighlightSegment[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [{ text, match: false }];
  }

  const lowerText = text.toLowerCase();
  const segments: HighlightSegment[] = [];
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(normalizedQuery);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      segments.push({
        text: text.slice(startIndex, matchIndex),
        match: false,
      });
    }

    segments.push({
      text: text.slice(matchIndex, matchIndex + normalizedQuery.length),
      match: true,
    });

    startIndex = matchIndex + normalizedQuery.length;
    matchIndex = lowerText.indexOf(normalizedQuery, startIndex);
  }

  if (startIndex < text.length) {
    segments.push({ text: text.slice(startIndex), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}

export function getNodeNamesAlongPath(
  nodes: FamilyTreeNodeData[],
  path: number[],
): string[] {
  const names: string[] = [];
  let currentLevel = nodes;

  for (const nodeId of path) {
    const node = currentLevel.find((entry) => entry.id === nodeId);
    if (!node) {
      break;
    }

    names.push(node.name);
    currentLevel = node.children;
  }

  return names;
}

export function getFieldErrorMessage(
  details: Record<string, unknown> | undefined,
  field: string,
): string | undefined {
  if (!details || details.field !== field) {
    return undefined;
  }

  return typeof details.message === "string" ? details.message : undefined;
}
