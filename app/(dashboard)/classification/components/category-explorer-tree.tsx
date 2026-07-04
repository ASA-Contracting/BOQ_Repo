'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ExplorerTree } from '@/components/explorer-tree/ExplorerTree';
import { IconDots, IconPen, IconPlus } from '@/components/explorer-tree/classification-icons';
import type { CategoryExplorerTreeNode } from '@/lib/category-tree-builder';
import type { CategoryContextMenuState } from '@/hooks/use-classification-store';
import type { TagRecord } from '@/lib/tag-colors';
import {
  CategoryAssignedTagPill,
  CategoryTagPickerPopover,
} from './category-tag-picker';

type StoreSlice = {
  expandedIds: Set<number>;
  selectedNodeId: number | null;
  search: string;
  inline: {
    parentId: number | null;
    nodeId: number | null;
    mode: 'create' | 'rename';
    value: string;
    error: string;
  } | null;
  dragSourceIds: number[];
  setInline: (value: StoreSlice['inline']) => void;
  toggleExpanded: (nodeId: number) => void;
  setSelectedNodeId: (nodeId: number | null) => void;
  startInlineCreate: (parentId: number | null) => void;
  startInlineRename: (nodeId: number) => void;
  commitInline: () => Promise<void>;
  cancelInline: () => void;
  openContextMenu: (nodeId: number, label: string, x: number, y: number) => void;
  startDrag: (nodeIds: number[]) => void;
  updateDropTarget: (nodeId: number | null, invalid?: boolean) => void;
  commitDrop: (targetParentId: number | null) => Promise<void>;
  clearDragState: () => void;
};

type Props = {
  root: CategoryExplorerTreeNode | null;
  store: StoreSlice;
};

function nodeIdAsNumber(id: CategoryExplorerTreeNode['id']): number | null {
  return typeof id === 'number' ? id : null;
}

export function CategoryExplorerTree({ root, store }: Props) {
  if (!root) {
    return (
      <div className="mc-tree-empty">
        <span>No categories yet.</span>
      </div>
    );
  }

  return (
    <ExplorerTree
      root={root}
      renderRootNode={false}
      showGlyph
      showMeta={false}
      searchTerm={store.search}
      ariaLabel="Category hierarchy"
      onNodeSelected={({ node, ctrlKey, metaKey, shiftKey }) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId == null) return;
        if (!ctrlKey && !metaKey && !shiftKey) {
          store.setSelectedNodeId(nodeId);
        }
      }}
      onNodeToggled={(node) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId != null) {
          store.toggleExpanded(nodeId);
        }
      }}
      onNodeContextMenu={({ node, clientX, clientY }) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId == null) return;
        store.openContextMenu(nodeId, node.label, clientX, clientY);
      }}
      onNodeDoubleClick={(node) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId != null) store.startInlineRename(nodeId);
      }}
      onInlineValueChange={(_node, _mode, value) => {
        store.setInline(store.inline ? { ...store.inline, value, error: '' } : store.inline);
      }}
      onInlineSubmit={() => void store.commitInline()}
      onInlineCancel={() => store.cancelInline()}
    />
  );
}

export function CategoryContextMenu({
  menu,
  nodeTags,
  inheritedTags,
  allTags,
  onClose,
  onRename,
  onDelete,
  onAddChild,
  onAssignTagById,
  onRemoveTag,
  onCreateAndAssignTag,
}: {
  menu: CategoryContextMenuState;
  nodeTags: TagRecord[];
  inheritedTags: Array<{ tag: string; sourceLabel: string }>;
  allTags: TagRecord[];
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onAssignTagById: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  onCreateAndAssignTag: (name: string, color: string) => void;
}) {
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const tagPickerAnchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menu) {
      setTagPickerOpen(false);
      setTagQuery('');
    }
  }, [menu]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    let top = menu.y;
    let left = menu.x;
    const margin = 12;

    if (rect.bottom > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (rect.right > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (top < margin) top = margin;
    if (left < margin) left = margin;

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }, [menu, nodeTags.length, inheritedTags.length, tagPickerOpen]);

  if (!menu) return null;

  const assignedTagIds = new Set(nodeTags.map((tag) => tag.id));
  const tagCount = nodeTags.length + inheritedTags.length;

  const toggleTag = (tagId: number) => {
    if (assignedTagIds.has(tagId)) {
      onRemoveTag(tagId);
      return;
    }
    onAssignTagById(tagId);
  };

  return (
    <>
      <div className="mc-tree-overlay-backdrop" onMouseDown={onClose} />
      <div
        ref={menuRef}
        className="mc-tree-context-menu"
        role="menu"
        tabIndex={-1}
        style={{ left: menu.x, top: menu.y }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (tagPickerOpen) {
              setTagPickerOpen(false);
              return;
            }
            onClose();
          }
        }}
      >
        <div className="mc-tree-context-menu__head">
          <span className="mc-tree-context-menu__eyebrow">Category Menu</span>
          <strong>{menu.label}</strong>
        </div>
        <button type="button" role="menuitem" onClick={onAddChild}>
          <i aria-hidden="true">
            <IconPlus />
          </i>
          <span>Add child</span>
        </button>
        <button type="button" role="menuitem" onClick={onRename}>
          <i aria-hidden="true">
            <IconPen />
          </i>
          <span>Rename</span>
        </button>

        <div className="mc-tree-context-menu__section" role="group" aria-label="Tags">
          <div className="mc-tree-context-menu__section-head">
            <span className="mc-tree-context-menu__section-title">Tags</span>
            <span className="mc-tree-context-menu__section-count">{tagCount}</span>
          </div>

          {nodeTags.length > 0 || inheritedTags.length > 0 ? (
            <div className="mc-tree-context-tags mc-tree-context-tags--assigned">
              {nodeTags.map((tag) => (
                <CategoryAssignedTagPill key={tag.id} tag={tag} onRemove={() => onRemoveTag(tag.id)} />
              ))}
              {inheritedTags.map((row) => (
                <span
                  key={`${row.tag}-${row.sourceLabel}`}
                  className="mc-tree-context-tag-pill is-inherited"
                  title={`Inherited from ${row.sourceLabel}`}
                >
                  <span className="mc-tree-context-tag-pill__label">{row.tag}</span>
                  <small className="mc-tree-context-tag-pill__source">{row.sourceLabel}</small>
                </span>
              ))}
            </div>
          ) : (
            <div className="mc-tree-context-empty">No tags on this category yet.</div>
          )}

          <div className="mc-tree-context-tag-trigger">
            <button
              type="button"
              className="mc-tree-context-tag-trigger__field"
              onClick={() => setTagPickerOpen(true)}
            >
              Select or create a tag
            </button>
            <button
              ref={tagPickerAnchorRef}
              type="button"
              className="mc-tree-context-tag-trigger__menu"
              title="Select or create tags"
              aria-label="Select or create tags"
              aria-haspopup="dialog"
              aria-expanded={tagPickerOpen}
              onClick={() => setTagPickerOpen((open) => !open)}
            >
              <i aria-hidden="true">
                <IconDots />
              </i>
            </button>
          </div>
        </div>

        <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      <CategoryTagPickerPopover
        anchorRef={tagPickerAnchorRef}
        open={tagPickerOpen}
        tags={allTags}
        assignedTagIds={assignedTagIds}
        query={tagQuery}
        onQueryChange={setTagQuery}
        onToggleTag={toggleTag}
        onCreateTag={(name, color) => {
          onCreateAndAssignTag(name, color);
          setTagQuery('');
        }}
        onClose={() => setTagPickerOpen(false)}
      />
    </>
  );
}
