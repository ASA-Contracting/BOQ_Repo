'use client';

import { useEffect, useRef } from 'react';
import type { CategoryExplorerTreeNode } from '@/lib/category-tree-builder';
import { IconBoxSeam, IconBranchCount, IconCashCoin } from './classification-icons';
import {
  depthClass,
  getChildGuides,
  getLabelParts,
  getNodeCountSummary,
  hasChildren,
  isExpanded,
  shouldRenderChildren,
  shouldShowCount,
  shouldShowPriceRecordCount,
  shouldShowRecordCount,
} from './explorer-tree-utils';

export type ExplorerTreeSelectEvent = {
  node: CategoryExplorerTreeNode;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export type ExplorerTreeContextMenuEvent = {
  node: CategoryExplorerTreeNode;
  clientX: number;
  clientY: number;
};

type Props = {
  root: CategoryExplorerTreeNode | null;
  ariaLabel?: string;
  renderRootNode?: boolean;
  showGlyph?: boolean;
  showMeta?: boolean;
  searchTerm?: string;
  onNodeSelected?: (event: ExplorerTreeSelectEvent) => void;
  onNodeToggled?: (node: CategoryExplorerTreeNode) => void;
  onNodeContextMenu?: (event: ExplorerTreeContextMenuEvent) => void;
  onNodeDoubleClick?: (node: CategoryExplorerTreeNode) => void;
  onInlineValueChange?: (node: CategoryExplorerTreeNode, mode: 'create' | 'rename', value: string) => void;
  onInlineSubmit?: (node: CategoryExplorerTreeNode, mode: 'create' | 'rename') => void;
  onInlineCancel?: (node: CategoryExplorerTreeNode, mode: 'create' | 'rename') => void;
};

function AutoFocusInput({
  value,
  placeholder,
  selectAll,
  onChange,
  onEnter,
  onEscape,
}: {
  value: string;
  placeholder: string;
  selectAll?: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
  onEscape: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const input = ref.current;
      if (!input) return;
      input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      input.focus({ preventScroll: true });
      if (selectAll) input.select();
    });
  }, [selectAll]);

  return (
    <input
      ref={ref}
      className="explorer-tree__editor-input"
      type="text"
      value={value}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onEnter();
        if (event.key === 'Escape') onEscape();
      }}
    />
  );
}

function InlineEditor({
  node,
  mode,
  onInlineValueChange,
  onInlineSubmit,
  onInlineCancel,
}: {
  node: CategoryExplorerTreeNode;
  mode: 'create' | 'rename';
  onInlineValueChange?: Props['onInlineValueChange'];
  onInlineSubmit?: Props['onInlineSubmit'];
  onInlineCancel?: Props['onInlineCancel'];
}) {
  const value = node.inlineValue ?? (mode === 'rename' ? node.label : '');
  const placeholder = node.inlinePlaceholder || (mode === 'create' ? 'Add child node' : 'Rename this node');

  return (
    <div className={`explorer-tree__editor explorer-tree__editor--${mode}`}>
      <AutoFocusInput
        value={value}
        placeholder={placeholder}
        selectAll={mode === 'rename'}
        onChange={(next) => onInlineValueChange?.(node, mode, next)}
        onEnter={() => onInlineSubmit?.(node, mode)}
        onEscape={() => onInlineCancel?.(node, mode)}
      />
      <div className="explorer-tree__editor-actions">
        <button
          type="button"
          className="explorer-tree__editor-btn"
          onClick={(event) => {
            event.stopPropagation();
            onInlineCancel?.(node, mode);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="explorer-tree__editor-btn is-primary"
          onClick={(event) => {
            event.stopPropagation();
            onInlineSubmit?.(node, mode);
          }}
        >
          Save
        </button>
      </div>
      {node.inlineError && <div className="explorer-tree__editor-error">{node.inlineError}</div>}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  isRoot,
  isLast,
  guides,
  showGlyph,
  showMeta,
  searchTerm,
  onNodeSelected,
  onNodeToggled,
  onNodeContextMenu,
  onNodeDoubleClick,
  onInlineValueChange,
  onInlineSubmit,
  onInlineCancel,
}: {
  node: CategoryExplorerTreeNode;
  depth: number;
  isRoot: boolean;
  isLast: boolean;
  guides: boolean[];
  showGlyph: boolean;
  showMeta: boolean;
  searchTerm: string;
} & Pick<
  Props,
  | 'onNodeSelected'
  | 'onNodeToggled'
  | 'onNodeContextMenu'
  | 'onNodeDoubleClick'
  | 'onInlineValueChange'
  | 'onInlineSubmit'
  | 'onInlineCancel'
>) {
  const expanded = hasChildren(node) && isExpanded(node);
  const selected = node.selected === true;
  const nodeHasTags = Boolean(node.tags?.length);
  const levelClass = depthClass(depth);

  return (
    <div
      className={[
        'explorer-tree__item',
        isRoot ? 'is-root' : '',
        isLast ? 'is-last' : '',
        levelClass,
        hasChildren(node) ? 'is-branch' : 'is-leaf',
        expanded ? 'is-expanded' : '',
        nodeHasTags ? 'has-tags' : '',
        selected ? 'is-selected is-active-node' : '',
        node.dragging ? 'is-dragging' : '',
        node.dropTarget ? 'is-drop-target' : '',
        node.dropBlocked ? 'is-drop-blocked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-depth={depth}
      style={{ ['--explorer-tree-depth' as string]: depth }}
    >
      <div
        className={[
          'explorer-tree__row',
          selected ? 'is-selected is-active-node' : '',
          nodeHasTags ? 'has-tags' : '',
          node.dropTarget ? 'is-drop-target' : '',
          node.dropBlocked ? 'is-drop-blocked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-explorer-node-id={node.id}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={hasChildren(node) ? expanded : undefined}
        aria-selected={selected}
      >
        <div className="explorer-tree__cell">
          {(guides.length > 0 || !isRoot) && (
            <div className="explorer-tree__gutter">
              {guides.map((guide, index) => (
                <span
                  key={index}
                  className={`explorer-tree__guide ${guide ? 'is-active' : ''}`}
                  aria-hidden="true"
                />
              ))}
              {!isRoot && (
                <span className={`explorer-tree__branch ${isLast ? 'is-last' : ''}`}>
                  {hasChildren(node) ? (
                    <button
                      type="button"
                      className={`explorer-tree__toggle ${expanded ? 'is-open' : ''}`}
                      aria-label={expanded ? 'Collapse branch' : 'Expand branch'}
                      onClick={(event) => {
                        event.stopPropagation();
                        onNodeToggled?.(node);
                      }}
                    >
                      <svg className="explorer-tree__toggle-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M6.25 4.5 9.75 8l-3.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.45"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    <span className="explorer-tree__toggle-spacer" aria-hidden="true" />
                  )}
                </span>
              )}
            </div>
          )}

          {node.inlineMode === 'rename' ? (
            <InlineEditor
              node={node}
              mode="rename"
              onInlineValueChange={onInlineValueChange}
              onInlineSubmit={onInlineSubmit}
              onInlineCancel={onInlineCancel}
            />
          ) : (
            <button
              type="button"
              className={[
                'explorer-tree__node',
                selected ? 'is-selected is-active-node' : '',
                node.isRoot ? 'is-root' : '',
                levelClass,
                hasChildren(node) ? 'is-branch' : 'is-leaf',
                nodeHasTags ? 'has-tags' : '',
                node.matchesSearch ? 'is-search-match' : '',
                expanded ? 'is-expanded' : '',
                node.dragging ? 'is-dragging' : '',
                node.dropTarget ? 'is-drop-target' : '',
                node.dropBlocked ? 'is-drop-blocked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-depth={depth}
              data-explorer-node-id={node.id}
              title={node.tooltip || node.label}
              aria-current={selected ? 'true' : undefined}
              onClick={(event) => {
                onNodeSelected?.({
                  node,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  shiftKey: event.shiftKey,
                });
                if (hasChildren(node) && !expanded && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
                  onNodeToggled?.(node);
                }
              }}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onNodeDoubleClick?.(node);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onNodeContextMenu?.({ node, clientX: event.clientX, clientY: event.clientY });
              }}
            >
              {showGlyph && (
                <span
                  className={`explorer-tree__glyph ${hasChildren(node) ? 'is-branch' : ''} ${node.isRoot ? 'is-root' : ''}`}
                  aria-hidden="true"
                />
              )}

              <span className="explorer-tree__content">
                <span className="explorer-tree__title">
                  <span
                    className={`explorer-tree__label ${node.matchesSearch ? 'is-search-match' : ''}`}
                    dir="auto"
                  >
                    {getLabelParts(node.label, searchTerm).map((part, index) =>
                      part.match ? (
                        <mark key={index} className="explorer-tree__label-mark">
                          {part.text}
                        </mark>
                      ) : (
                        <span key={index}>{part.text}</span>
                      ),
                    )}
                  </span>
                </span>

                {showMeta && node.meta && (
                  <span className="explorer-tree__meta" dir="auto">
                    {node.meta}
                  </span>
                )}

                {nodeHasTags && (
                  <span className="explorer-tree__tag-list" aria-label="Material tags">
                    {node.tags!.map((tag) => (
                      <span
                        key={`${tag.label}-${tag.parentContext ? 'parent' : tag.inherited ? 'inherited' : 'direct'}`}
                        className={[
                          'explorer-tree__tag',
                          tag.parentContext ? 'is-parent-context' : '',
                          tag.inherited && !tag.parentContext ? 'is-inherited' : '',
                          tag.overflow ? 'is-overflow' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        title={
                          tag.title ||
                          (tag.parentContext
                            ? 'Parent category'
                            : tag.inherited
                              ? 'Inherited tag'
                              : 'Direct tag') ||
                          undefined
                        }
                        dir="auto"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </span>
                )}
              </span>

              <span className="explorer-tree__side">
                {(shouldShowPriceRecordCount(node) ||
                  shouldShowRecordCount(node) ||
                  shouldShowCount(node)) && (
                  <span className="explorer-tree__badges">
                    {shouldShowCount(node) && (
                      <span
                        className="explorer-tree__count-badge explorer-tree__count-badge--branches"
                        aria-label={`Child branches: ${node.count}`}
                        title={getNodeCountSummary(node)}
                      >
                        <IconBranchCount className="explorer-tree__count-icon explorer-tree__count-icon--branches" />
                        {node.count}
                      </span>
                    )}
                    {shouldShowRecordCount(node) && (
                      <span
                        className="explorer-tree__count-badge explorer-tree__count-badge--records"
                        aria-label={`Material records: ${node.recordCount}`}
                        title={getNodeCountSummary(node)}
                      >
                        <IconBoxSeam className="explorer-tree__count-icon explorer-tree__count-icon--records" />
                        {node.recordCount}
                      </span>
                    )}
                    {shouldShowPriceRecordCount(node) && (
                      <span
                        className="explorer-tree__count-badge explorer-tree__count-badge--price-records"
                        aria-label={`Price records: ${node.priceRecordCount}`}
                        title={getNodeCountSummary(node)}
                      >
                        <IconCashCoin className="explorer-tree__count-icon explorer-tree__count-icon--price-records" />
                        {node.priceRecordCount}
                      </span>
                    )}
                  </span>
                )}

                <span
                  className="explorer-tree__more"
                  title="Open menu"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                    onNodeContextMenu?.({
                      node,
                      clientX: rect.left,
                      clientY: rect.bottom + 4,
                    });
                  }}
                >
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      {(node.inlineMode === 'create' || hasChildren(node)) && (
        <div
          className={`explorer-tree__children ${hasChildren(node) && !expanded ? 'is-collapsed' : ''}`}
          role="group"
          aria-hidden={hasChildren(node) && !expanded ? true : undefined}
        >
          <div className="explorer-tree__children-track">
            {shouldRenderChildren(node) && (
              <span
                className="explorer-tree__thread-hitbox"
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation();
                  onNodeToggled?.(node);
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <span className="explorer-tree__thread-line" aria-hidden="true" />
              </span>
            )}

            {node.inlineMode === 'create' && (
              <div
                className={`explorer-tree__item explorer-tree__item--editor ${(node.children?.length ?? 0) === 0 ? 'is-last' : ''}`}
              >
                <div className="explorer-tree__row explorer-tree__row--editor" role="treeitem" aria-level={depth + 2}>
                  <div className="explorer-tree__cell">
                    <div className="explorer-tree__gutter">
                      {getChildGuides(guides, isRoot, isLast, depth).map((guide, index) => (
                        <span
                          key={index}
                          className={`explorer-tree__guide ${guide ? 'is-active' : ''}`}
                          aria-hidden="true"
                        />
                      ))}
                      <span
                        className={`explorer-tree__branch ${(node.children?.length ?? 0) === 0 ? 'is-last' : ''}`}
                      >
                        <span className="explorer-tree__toggle-spacer" aria-hidden="true" />
                      </span>
                    </div>
                    <InlineEditor
                      node={node}
                      mode="create"
                      onInlineValueChange={onInlineValueChange}
                      onInlineSubmit={onInlineSubmit}
                      onInlineCancel={onInlineCancel}
                    />
                  </div>
                </div>
              </div>
            )}

            {(node.children?.length ?? 0) > 0 &&
              node.children.map((child, index) => (
                <TreeNode
                  key={String(child.id)}
                  node={child}
                  depth={depth + 1}
                  isRoot={false}
                  isLast={index === node.children.length - 1}
                  guides={getChildGuides(guides, isRoot, isLast, depth)}
                  showGlyph={showGlyph}
                  showMeta={showMeta}
                  searchTerm={searchTerm}
                  onNodeSelected={onNodeSelected}
                  onNodeToggled={onNodeToggled}
                  onNodeContextMenu={onNodeContextMenu}
                  onNodeDoubleClick={onNodeDoubleClick}
                  onInlineValueChange={onInlineValueChange}
                  onInlineSubmit={onInlineSubmit}
                  onInlineCancel={onInlineCancel}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExplorerTree({
  root,
  ariaLabel = 'Hierarchy tree',
  renderRootNode = false,
  showGlyph = true,
  showMeta = false,
  searchTerm = '',
  onNodeSelected,
  onNodeToggled,
  onNodeContextMenu,
  onNodeDoubleClick,
  onInlineValueChange,
  onInlineSubmit,
  onInlineCancel,
}: Props) {
  if (!root) return null;

  const shared = {
    showGlyph,
    showMeta,
    searchTerm,
    onNodeSelected,
    onNodeToggled,
    onNodeContextMenu,
    onNodeDoubleClick,
    onInlineValueChange,
    onInlineSubmit,
    onInlineCancel,
  };

  return (
    <div className="explorer-tree-host">
      <div className="explorer-tree" role="tree" aria-label={ariaLabel}>
        {renderRootNode ? (
          <TreeNode node={root} depth={0} isRoot isLast guides={[]} {...shared} />
        ) : (
          <>
            {root.children.map((child, index) => (
              <TreeNode
                key={String(child.id)}
                node={child}
                depth={0}
                isRoot={false}
                isLast={index === root.children.length - 1}
                guides={[]}
                {...shared}
              />
            ))}
            {root.inlineMode === 'create' && (
              <div className="explorer-tree__item explorer-tree__item--editor explorer-tree__item--root-editor">
                <div className="explorer-tree__row explorer-tree__row--editor" role="treeitem" aria-level={1}>
                  <div className="explorer-tree__cell">
                    <InlineEditor
                      node={root}
                      mode="create"
                      onInlineValueChange={onInlineValueChange}
                      onInlineSubmit={onInlineSubmit}
                      onInlineCancel={onInlineCancel}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
