'use client';

import { CategoryTreeFilter } from './category-tree-filter';
import type { TreeFilterOptionMode } from '@/lib/category-tree-filter';
import { IconClear, IconCollapseAll, IconSearch } from '@/components/explorer-tree/classification-icons';

type Props = {
  search: string;
  searchMatchCount?: number;
  filterOpen: boolean;
  filterActive: boolean;
  filterLabel: string;
  bulkActionLabel: string;
  availableTags: Array<{ name: string; count: number }>;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleFilter: () => void;
  onToggleFilterOption: (option: TreeFilterOptionMode) => void;
  onToggleFilterBulkSelection: () => void;
  onToggleFilterTag: (tagName: string) => void;
  onClearFilterTags: () => void;
  isFilterOptionSelected: (option: TreeFilterOptionMode) => boolean;
  isFilterTagSelected: (tagName: string) => boolean;
  onCollapseAll: () => void;
};

export function CategorySearchStrip({
  search,
  searchMatchCount,
  filterOpen,
  filterActive,
  filterLabel,
  bulkActionLabel,
  availableTags,
  onSearchChange,
  onClearSearch,
  onToggleFilter,
  onToggleFilterOption,
  onToggleFilterBulkSelection,
  onToggleFilterTag,
  onClearFilterTags,
  isFilterOptionSelected,
  isFilterTagSelected,
  onCollapseAll,
}: Props) {
  const hasQuery = search.trim().length > 0;

  return (
    <div className="mc-tree-search-strip" role="search">
      <span className="mc-tree-search-icon-wrap" aria-hidden="true">
        <IconSearch className="mc-tree-search-icon" />
      </span>
      <input
        type="text"
        className="mc-tree-search-input"
        value={search}
        placeholder="Search categories"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {hasQuery && searchMatchCount != null && (
        <span className="mc-tree-search-count" aria-live="polite">
          {searchMatchCount}
        </span>
      )}
      {hasQuery && (
        <button type="button" className="mc-tree-search-clear" aria-label="Clear search" onClick={onClearSearch}>
          <IconClear />
        </button>
      )}
      <span className="mc-tree-search-divider" aria-hidden="true" />
      <CategoryTreeFilter
        open={filterOpen}
        active={filterActive}
        label={filterLabel}
        bulkActionLabel={bulkActionLabel}
        availableTags={availableTags}
        isOptionSelected={isFilterOptionSelected}
        isTagSelected={isFilterTagSelected}
        onToggle={onToggleFilter}
        onToggleOption={onToggleFilterOption}
        onToggleBulkSelection={onToggleFilterBulkSelection}
        onToggleTag={onToggleFilterTag}
        onClearTags={onClearFilterTags}
      />
      <span className="mc-tree-search-divider" aria-hidden="true" />
      <button type="button" className="mc-tree-search-tool" title="Collapse all" onClick={onCollapseAll}>
        <IconCollapseAll />
      </button>
    </div>
  );
}
