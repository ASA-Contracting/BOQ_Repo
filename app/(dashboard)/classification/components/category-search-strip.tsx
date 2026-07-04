'use client';

import { CategoryTreeFilter } from './category-tree-filter';
import type { TreeFilterOptionMode } from '@/lib/category-tree-filter';
import {
  IconClear,
  IconCollapseAll,
  IconExpandAll,
  IconParentTrail,
  IconSearch,
} from '@/components/explorer-tree/classification-icons';

import type { TagRecord } from '@/lib/tag-colors';

type Props = {
  search: string;
  searchMatchCount?: number;
  filterOpen: boolean;
  filterActive: boolean;
  filterLabel: string;
  bulkActionLabel: string;
  availableTags: Array<{ name: string; count: number }>;
  allTags: TagRecord[];
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleFilter: () => void;
  onToggleFilterOption: (option: TreeFilterOptionMode) => void;
  onToggleFilterBulkSelection: () => void;
  onToggleFilterTag: (tagName: string) => void;
  onClearFilterTags: () => void;
  isFilterOptionSelected: (option: TreeFilterOptionMode) => boolean;
  isFilterTagSelected: (tagName: string) => boolean;
  onUpdateTag: (tag: TagRecord) => void;
  onDeleteTag: (tagId: number) => void;
  treeFullyExpanded: boolean;
  onToggleExpandCollapse: () => void;
  showParentContext: boolean;
  onToggleShowParentContext: () => void;
};

export function CategorySearchStrip({
  search,
  searchMatchCount,
  filterOpen,
  filterActive,
  filterLabel,
  bulkActionLabel,
  availableTags,
  allTags,
  onSearchChange,
  onClearSearch,
  onToggleFilter,
  onToggleFilterOption,
  onToggleFilterBulkSelection,
  onToggleFilterTag,
  onClearFilterTags,
  isFilterOptionSelected,
  isFilterTagSelected,
  onUpdateTag,
  onDeleteTag,
  treeFullyExpanded,
  onToggleExpandCollapse,
  showParentContext,
  onToggleShowParentContext,
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
        allTags={allTags}
        isOptionSelected={isFilterOptionSelected}
        isTagSelected={isFilterTagSelected}
        onToggle={onToggleFilter}
        onToggleOption={onToggleFilterOption}
        onToggleBulkSelection={onToggleFilterBulkSelection}
        onToggleTag={onToggleFilterTag}
        onClearTags={onClearFilterTags}
        onUpdateTag={onUpdateTag}
        onDeleteTag={onDeleteTag}
      />
      <span className="mc-tree-search-divider" aria-hidden="true" />
      <button
        type="button"
        className={`mc-tree-search-tool mc-tree-search-tool--static mc-tree-search-tool--parent-context ${showParentContext ? 'is-active' : ''}`}
        title={showParentContext ? 'Hide parent categories' : 'Show parent categories'}
        aria-label={showParentContext ? 'Hide parent categories on tree rows' : 'Show parent categories on tree rows'}
        aria-pressed={showParentContext}
        onClick={onToggleShowParentContext}
      >
        <IconParentTrail />
      </button>
      <span className="mc-tree-search-divider" aria-hidden="true" />
      <button
        type="button"
        className="mc-tree-search-tool"
        title={treeFullyExpanded ? 'Collapse all' : 'Expand all'}
        aria-label={treeFullyExpanded ? 'Collapse all categories' : 'Expand all categories'}
        onClick={onToggleExpandCollapse}
      >
        {treeFullyExpanded ? <IconCollapseAll /> : <IconExpandAll />}
      </button>
    </div>
  );
}
