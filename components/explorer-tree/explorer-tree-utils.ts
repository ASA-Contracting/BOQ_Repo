import type { CategoryExplorerTreeNode } from '@/lib/category-tree-builder';

export function hasChildren(node: CategoryExplorerTreeNode): boolean {
  return Boolean(node.canToggle ?? node.children?.length);
}

export function isExpanded(node: CategoryExplorerTreeNode): boolean {
  return node.expanded !== false;
}

export function shouldRenderChildren(node: CategoryExplorerTreeNode): boolean {
  return hasChildren(node) && isExpanded(node) && (node.children?.length ?? 0) > 0;
}

export function shouldShowCount(node: CategoryExplorerTreeNode): boolean {
  return node.count != null && node.count > 0;
}

export function shouldShowRecordCount(node: CategoryExplorerTreeNode): boolean {
  return node.recordCount != null && node.recordCount > 0;
}

export function shouldShowPriceRecordCount(node: CategoryExplorerTreeNode): boolean {
  return node.priceRecordCount != null && node.priceRecordCount > 0;
}

export function getNodeCountSummary(node: CategoryExplorerTreeNode): string {
  const parts: string[] = [];
  if (shouldShowCount(node)) {
    parts.push(`${node.count} child ${node.count === 1 ? 'branch' : 'branches'}`);
  }
  if (shouldShowRecordCount(node)) {
    parts.push(`${node.recordCount} material ${node.recordCount === 1 ? 'record' : 'records'}`);
  }
  if (shouldShowPriceRecordCount(node)) {
    parts.push(
      `${node.priceRecordCount} price ${node.priceRecordCount === 1 ? 'record' : 'records'}`,
    );
  }
  return parts.join(' / ');
}

export function getChildGuides(
  guides: boolean[],
  isRoot: boolean,
  isLast: boolean,
  depth = 0,
): boolean[] {
  return isRoot || depth === 0 ? guides : [...guides, !isLast];
}

export function getLabelParts(
  label: string,
  searchTerm: string,
): Array<{ text: string; match: boolean }> {
  const value = String(label ?? '');
  const query = searchTerm.trim();
  if (!query) {
    return [{ text: value, match: false }];
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  let index = lowerValue.indexOf(lowerQuery, cursor);

  while (index >= 0) {
    if (index > cursor) {
      parts.push({ text: value.slice(cursor, index), match: false });
    }
    parts.push({ text: value.slice(index, index + query.length), match: true });
    cursor = index + query.length;
    index = lowerValue.indexOf(lowerQuery, cursor);
  }

  if (!parts.length) {
    parts.push({ text: value, match: false });
  } else if (cursor < value.length) {
    parts.push({ text: value.slice(cursor), match: false });
  }

  return parts;
}

export function depthClass(depth: number): string {
  if (depth === 0) return 'is-level-0';
  if (depth === 1) return 'is-level-1';
  if (depth === 2) return 'is-level-2';
  if (depth === 3) return 'is-level-3';
  return 'is-level-deep';
}
