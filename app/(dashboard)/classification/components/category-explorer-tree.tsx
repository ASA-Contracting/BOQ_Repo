'use client';

import { useEffect, useRef, useState } from 'react';
import { ExplorerTree } from '@/components/explorer-tree/ExplorerTree';
import { IconPen, IconPlus, IconTag, IconX } from '@/components/explorer-tree/classification-icons';
import type { CategoryExplorerTreeNode } from '@/lib/category-tree-builder';
import type { CategoryContextMenuState } from '@/hooks/use-classification-store';

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
      ariaLabel="Material classification hierarchy"
      onNodeSelected={({ node, ctrlKey, metaKey, shiftKey }) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId == null) return;
        if (!ctrlKey && !metaKey && !shiftKey) {
          store.setSelectedNodeId(nodeId);
        }
      }}
      onNodeToggled={(node) => {
        const nodeId = nodeIdAsNumber(node.id);
        if (nodeId != null) store.toggleExpanded(nodeId);
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
  availableTags,
  onClose,
  onRename,
  onDelete,
  onAddChild,
  onAssignTag,
  onRemoveTag,
}: {
  menu: CategoryContextMenuState;
  nodeTags: Array<{ id: number; name: string }>;
  inheritedTags: Array<{ tag: string; sourceLabel: string }>;
  availableTags: string[];
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onAssignTag: (tagName: string) => void;
  onRemoveTag: (tagId: number) => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menu) {
      setTagInput('');
      queueMicrotask(() => tagInputRef.current?.focus());
    }
  }, [menu]);

  if (!menu) return null;

  const submitTag = () => {
    const trimmed = tagInput.trim().replace(/^#+/, '');
    if (!trimmed) return;
    onAssignTag(trimmed);
    setTagInput('');
  };

  const tagCount = nodeTags.length + inheritedTags.length;

  return (
    <>
      <div className="mc-tree-overlay-backdrop" onMouseDown={onClose} />
      <div
        className="mc-tree-context-menu"
        role="menu"
        tabIndex={-1}
        style={{ left: menu.x, top: menu.y }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
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
            <div className="mc-tree-context-tags">
              {nodeTags.map((tag) => (
                <span key={tag.id} className="mc-tree-context-tag" title="Direct tag">
                  <span className="mc-tree-context-tag__main" title="Direct tag">
                    <i aria-hidden="true">
                      <IconTag />
                    </i>
                    <span>{tag.name}</span>
                  </span>
                  <button
                    type="button"
                    className="mc-tree-context-tag__remove"
                    title="Remove from this category"
                    aria-label="Remove tag from this category"
                    onClick={() => onRemoveTag(tag.id)}
                  >
                    <i aria-hidden="true">
                      <IconX />
                    </i>
                  </button>
                </span>
              ))}
              {inheritedTags.map((row) => (
                <span
                  key={`${row.tag}-${row.sourceLabel}`}
                  className="mc-tree-context-tag is-inherited"
                  title={`Inherited from ${row.sourceLabel}`}
                >
                  <span className="mc-tree-context-tag__main is-static">
                    <i aria-hidden="true">
                      <IconTag />
                    </i>
                    <span>{row.tag}</span>
                    <small>{row.sourceLabel}</small>
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="mc-tree-context-empty">No tags on this category yet.</div>
          )}

          <form
            className="mc-tree-context-tag-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitTag();
            }}
          >
            <input
              ref={tagInputRef}
              type="text"
              name="categoryTag"
              value={tagInput}
              placeholder="Add tag, e.g. HVAC"
              autoComplete="off"
              onChange={(event) => setTagInput(event.target.value)}
            />
            <button type="submit" className="mc-tree-context-tag-submit" disabled={!tagInput.trim()}>
              Apply
            </button>
          </form>

          {availableTags.length > 0 && (
            <>
              <span className="mc-tree-context-menu__section-title">Apply existing</span>
              <div className="mc-tree-context-suggestions">
                {availableTags.map((tag) => (
                  <span key={tag} className="mc-tree-context-suggestion">
                    <button type="button" className="mc-tree-context-suggestion__main" onClick={() => onAssignTag(tag)}>
                      {tag}
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </>
  );
}
