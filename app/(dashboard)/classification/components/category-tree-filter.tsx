'use client';

import { useRef, useState, type ReactNode } from 'react';
import { TREE_FILTER_OPTION_MODES, type TreeFilterOptionMode } from '@/lib/category-tree-filter';
import {
  IconArchive,
  IconBookmarkStar,
  IconFilter,
  IconPen,
  IconTag,
} from '@/components/explorer-tree/classification-icons';
import { CategoryTagEditPopover } from './category-tag-picker';
import { resolveTagColor, tagColorStyle, type TagRecord } from '@/lib/tag-colors';

type Props = {
  open: boolean;
  active: boolean;
  label: string;
  bulkActionLabel: string;
  availableTags: Array<{ name: string; count: number }>;
  allTags: TagRecord[];
  isOptionSelected: (option: TreeFilterOptionMode) => boolean;
  isTagSelected: (tagName: string) => boolean;
  onToggle: () => void;
  onToggleOption: (option: TreeFilterOptionMode) => void;
  onToggleBulkSelection: () => void;
  onToggleTag: (tagName: string) => void;
  onClearTags: () => void;
  onUpdateTag: (tag: TagRecord) => void;
  onDeleteTag: (tagId: number) => void;
};

const OPTION_META: Record<TreeFilterOptionMode, { label: string; icon: ReactNode }> = {
  tagged: { label: 'Tagged', icon: <IconBookmarkStar /> },
  untagged: { label: 'No tags', icon: <IconArchive /> },
};

export function CategoryTreeFilter({
  open,
  active,
  label,
  bulkActionLabel,
  availableTags,
  allTags,
  isOptionSelected,
  isTagSelected,
  onToggle,
  onToggleOption,
  onToggleBulkSelection,
  onToggleTag,
  onClearTags,
  onUpdateTag,
  onDeleteTag,
}: Props) {
  const [editingTag, setEditingTag] = useState<TagRecord | null>(null);
  const editAnchorRef = useRef<HTMLElement | null>(null);

  const safeTags = Array.isArray(allTags) ? allTags : [];
  const sortedTags = [...safeTags].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  );

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
            <span>Visibility</span>
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

          <div className="mc-tree-filter__section mc-tree-filter__section--filter">
            <div className="mc-tree-filter__head mc-tree-filter__head--section">
              <span>Filter by tag</span>
              {availableTags.some((tag) => isTagSelected(tag.name)) && (
                <button type="button" className="mc-tree-filter__clear" onClick={onClearTags}>
                  Clear
                </button>
              )}
            </div>
            {availableTags.length === 0 ? (
              <div className="mc-tree-filter__empty">No tags applied yet.</div>
            ) : (
              <div className="mc-tree-filter__filter-list">
                {availableTags.map((tag) => (
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
                ))}
              </div>
            )}
          </div>

          <div className="mc-tree-filter__section mc-tree-filter__section--manage">
            <div className="mc-tree-filter__head mc-tree-filter__head--section">
              <span>Manage tags</span>
            </div>
            {sortedTags.length === 0 ? (
              <div className="mc-tree-filter__empty">No tags created yet.</div>
            ) : (
              <div className="mc-tree-filter__manage-list">
                {sortedTags.map((tag) => (
                  <div key={tag.id} className="mc-tree-filter__manage-row">
                    <span className="mc-tree-filter__manage-pill" style={tagColorStyle(tag)}>
                      {tag.name}
                    </span>
                    <button
                      type="button"
                      className="mc-tree-filter__manage-edit"
                      title={`Edit tag ${tag.name}`}
                      aria-label={`Edit tag ${tag.name}`}
                      aria-haspopup="dialog"
                      aria-expanded={editingTag?.id === tag.id}
                      onClick={(event) => {
                        editAnchorRef.current = event.currentTarget;
                        setEditingTag({ ...tag, color: resolveTagColor(tag) });
                      }}
                    >
                      <i className="mc-tree-filter__manage-edit-icon" aria-hidden="true">
                        <IconPen />
                      </i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editingTag ? (
        <CategoryTagEditPopover
          anchorRef={editAnchorRef}
          tag={editingTag}
          onChange={setEditingTag}
          onSave={() => {
            onUpdateTag(editingTag);
            setEditingTag(null);
          }}
          onDelete={() => {
            onDeleteTag(editingTag.id);
            setEditingTag(null);
          }}
          onClose={() => setEditingTag(null)}
        />
      ) : null}
    </div>
  );
}
