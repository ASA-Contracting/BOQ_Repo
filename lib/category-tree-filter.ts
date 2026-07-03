export const TREE_FILTER_OPTION_MODES = [
  'tagged',
  'untagged',
] as const;

export type TreeFilterOptionMode = (typeof TREE_FILTER_OPTION_MODES)[number];

export type CategoryTreeFilter =
  | 'all'
  | 'none'
  | TreeFilterOptionMode
  | `custom:${string}`;

export const TREE_FILTER_STORAGE_KEY = 'cls-app.classification.tree-filter.v1';
export const TREE_TAG_FILTER_STORAGE_KEY = 'cls-app.classification.tree-tag-filter.v1';
export const TREE_PARENT_CONTEXT_STORAGE_KEY = 'cls-app.classification.tree-parent-context.v1';

export function isTreeFilterOptionMode(value: unknown): value is TreeFilterOptionMode {
  return TREE_FILTER_OPTION_MODES.includes(value as TreeFilterOptionMode);
}

export function getTreeFilterSelectedModes(mode: CategoryTreeFilter): Set<TreeFilterOptionMode> {
  if (mode === 'all') {
    return new Set(TREE_FILTER_OPTION_MODES);
  }
  if (mode === 'none') {
    return new Set<TreeFilterOptionMode>();
  }
  if (isTreeFilterOptionMode(mode)) {
    return new Set([mode]);
  }
  return new Set(
    mode
      .slice('custom:'.length)
      .split(',')
      .filter(isTreeFilterOptionMode)
  );
}

export function formatTreeFilterMode(
  selectedModes: Iterable<TreeFilterOptionMode>
): CategoryTreeFilter {
  const selected = new Set(selectedModes);
  const ordered = TREE_FILTER_OPTION_MODES.filter((mode) => selected.has(mode));
  if (!ordered.length) {
    return 'none';
  }
  if (ordered.length === TREE_FILTER_OPTION_MODES.length) {
    return 'all';
  }
  if (ordered.length === 1) {
    return ordered[0];
  }
  return `custom:${ordered.join(',')}`;
}

export function normalizeTreeFilterMode(mode: CategoryTreeFilter): CategoryTreeFilter {
  return formatTreeFilterMode(getTreeFilterSelectedModes(mode));
}

export function isTreeFilterMode(value: unknown): value is CategoryTreeFilter {
  if (value === 'all' || value === 'none' || isTreeFilterOptionMode(value)) {
    return true;
  }
  if (typeof value !== 'string' || !value.startsWith('custom:')) {
    return false;
  }
  return value
    .slice('custom:'.length)
    .split(',')
    .filter(isTreeFilterOptionMode).length > 0;
}

export function readStoredTreeFilter(): CategoryTreeFilter {
  if (typeof localStorage === 'undefined') {
    return 'all';
  }
  try {
    const raw = localStorage.getItem(TREE_FILTER_STORAGE_KEY);
    return isTreeFilterMode(raw) ? normalizeTreeFilterMode(raw) : 'all';
  } catch {
    return 'all';
  }
}

export function writeStoredTreeFilter(mode: CategoryTreeFilter): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(TREE_FILTER_STORAGE_KEY, mode);
  } catch {
    // Ignore blocked storage.
  }
}

export function readStoredTreeTagFilter(): Set<string> {
  if (typeof localStorage === 'undefined') {
    return new Set<string>();
  }
  try {
    const raw = localStorage.getItem(TREE_TAG_FILTER_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }
    const parsed = JSON.parse(raw) as unknown;
    return new Set(
      Array.isArray(parsed)
        ? parsed
            .map((value) => String(value ?? '').trim().replace(/^#+/, '').toLowerCase())
            .filter(Boolean)
        : []
    );
  } catch {
    return new Set<string>();
  }
}

export function writeStoredTreeTagFilter(tagNames: Iterable<string>): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(
      TREE_TAG_FILTER_STORAGE_KEY,
      JSON.stringify(
        Array.from(new Set(tagNames))
          .map((value) => value.trim().replace(/^#+/, '').toLowerCase())
          .filter(Boolean)
          .sort()
      )
    );
  } catch {
    // Ignore blocked storage.
  }
}

export function readStoredShowParentContext(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(TREE_PARENT_CONTEXT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeStoredShowParentContext(enabled: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(TREE_PARENT_CONTEXT_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore blocked storage.
  }
}

export function toggleTreeFilterOption(
  current: CategoryTreeFilter,
  option: TreeFilterOptionMode
): CategoryTreeFilter {
  const selected = getTreeFilterSelectedModes(current);
  if (selected.has(option)) {
    selected.delete(option);
  } else {
    selected.add(option);
  }
  return formatTreeFilterMode(selected);
}

export function toggleTreeFilterBulkSelection(current: CategoryTreeFilter): CategoryTreeFilter {
  const selected = getTreeFilterSelectedModes(current);
  if (selected.size === TREE_FILTER_OPTION_MODES.length) {
    return 'none';
  }
  return 'all';
}

export function getTreeFilterLabel(mode: CategoryTreeFilter): string {
  if (mode === 'all') {
    return 'All categories';
  }
  if (mode === 'none') {
    return 'No filters';
  }
  const selected = getTreeFilterSelectedModes(mode);
  if (selected.size === 1) {
    const [only] = Array.from(selected);
    switch (only) {
      case 'tagged':
        return 'Tagged';
      case 'untagged':
        return 'No tags';
      default:
        return 'Filtered';
    }
  }
  return `${selected.size} filters`;
}

export function isTreeFilterActive(mode: CategoryTreeFilter, tagNames: Set<string>): boolean {
  if (tagNames.size > 0) {
    return true;
  }
  const selected = getTreeFilterSelectedModes(mode);
  return selected.size > 0 && selected.size < TREE_FILTER_OPTION_MODES.length;
}

export function matchesModeFilter(
  selectedModes: Set<TreeFilterOptionMode>,
  tagNames: string[],
  materialItemCount: number
): boolean {
  if (selectedModes.size === 0) {
    return false;
  }
  if (selectedModes.size === TREE_FILTER_OPTION_MODES.length) {
    return true;
  }
  return (
    (selectedModes.has('tagged') && tagNames.length > 0) ||
    (selectedModes.has('untagged') && tagNames.length === 0)
  );
}

export function matchesTagFilter(tagFilterNames: Set<string>, tagNames: string[]): boolean {
  if (tagFilterNames.size === 0) {
    return true;
  }
  return tagNames.some((tag) => tagFilterNames.has(tag.toLowerCase()));
}
