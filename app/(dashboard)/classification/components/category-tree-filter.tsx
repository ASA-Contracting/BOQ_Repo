'use client';

import type { ReactNode } from 'react';
import { TREE_FILTER_OPTION_MODES, type TreeFilterOptionMode } from '@/lib/category-tree-filter';
import {
  IconArchive,
  IconBookmarkStar,
  IconBoxSeam,
  IconCashCoin,
  IconFilter,
  IconTag,
} from '@/components/explorer-tree/classification-icons';

type Props = {
  open: boolean;
  active: boolean;
  label: string;
  bulkActionLabel: string;
  availableTags: Array<{ name: string; count: number }>;
  isOptionSelected: (option: TreeFilterOptionMode) => boolean;
  isTagSelected: (tagName: string) => boolean;
  onToggle: () => void;
  onToggleOption: (option: TreeFilterOptionMode) => void;
  onToggleBulkSelection: () => void;
  onToggleTag: (tagName: string) => void;
  onClearTags: () => void;
};

const OPTION_META: Record<TreeFilterOptionMode, { label: string; icon: ReactNode }> = {
  tagged: { label: 'Tagged', icon: <IconBookmarkStar /> },
  untagged: { label: 'No tags', icon: <IconArchive /> },
  'material-records': { label: 'Material records', icon: <IconBoxSeam /> },
  'price-records': { label: 'Price records', icon: <IconCashCoin /> },
};

export function CategoryTreeFilter({
  open,
  active,
  label,
  bulkActionLabel,
  availableTags,
  isOptionSelected,
  isTagSelected,
  onToggle,
  onToggleOption,
  onToggleBulkSelection,
  onToggleTag,
  onClearTags,
}: Props) {
  return (
    <div className="mc-tree-filter">
      <button
        type="button"
        className={`mc-tree-search-tool mc-tree-filter__trigger ${active ? 'is-active' : ''} ${open ? 'is-open' : ''}`}
        aria-label={`Filter categories: ${label}`}
        title={`Filter: ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <IconFilter />
      </button>
      {open && (
        <div className="mc-tree-filter__menu" role="menu">
          <div className="mc-tree-filter__head">
            <span>Categories</span>
            <button type="button" className="mc-tree-filter__clear" onClick={onToggleBulkSelection}>
              {bulkActionLabel}
            </button>
          </div>
          {TREE_FILTER_OPTION_MODES.map((option) => (
            <button
              key={option}
              type="button"
              className={isOptionSelected(option) ? 'is-active' : ''}
              role="menuitemcheckbox"
              aria-checked={isOptionSelected(option)}
              onClick={() => onToggleOption(option)}
            >
              <i aria-hidden="true">{OPTION_META[option].icon}</i>
              <span>{OPTION_META[option].label}</span>
            </button>
          ))}
          <div className="mc-tree-filter__section">
            <div className="mc-tree-filter__head mc-tree-filter__head--section">
              <span>Tags</span>
              {availableTags.some((tag) => isTagSelected(tag.name)) && (
                <button type="button" className="mc-tree-filter__clear" onClick={onClearTags}>
                  Clear
                </button>
              )}
            </div>
            {availableTags.length === 0 ? (
              <div className="mc-tree-filter__empty">No tags applied yet.</div>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  className={`mc-tree-filter__tag-option ${isTagSelected(tag.name) ? 'is-active' : ''}`}
                  role="menuitemcheckbox"
                  aria-checked={isTagSelected(tag.name)}
                  onClick={() => onToggleTag(tag.name)}
                >
                  <i aria-hidden="true">
                    <IconTag />
                  </i>
                  <span>#{tag.name}</span>
                  <small>{tag.count}</small>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
