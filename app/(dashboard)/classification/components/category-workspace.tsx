'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CategoryBulkPanel } from './category-bulk-panel';
import { CategoryExplorerTree, CategoryContextMenu } from './category-explorer-tree';
import { CategoryImportDrawer, readImportRowsFromFile } from './category-import-drawer';
import { CategoryImportPrompt } from './category-import-prompt';
import { CategoryLevelGridPanel } from './category-level-grid-panel';
import { CategorySearchStrip } from './category-search-strip';
import { CategoryTreeHeader } from './category-tree-header';
import type { CategoryExplorerTreeNode } from '@/lib/category-tree-builder';
import { getInheritedTagsForNode } from '@/lib/category-tree-builder';
import type { ClassificationStateDto } from '@/application/classification/dto';
import type { LevelOrderEntity } from '@/domain/classification/entities';
import { useClassificationStore } from '@/hooks/use-classification-store';

function countSearchMatches(root: CategoryExplorerTreeNode | null): number {
  if (!root) return 0;
  const walk = (node: CategoryExplorerTreeNode): number => {
    let count = node.matchesSearch ? 1 : 0;
    for (const child of node.children) count += walk(child);
    return count;
  };
  let total = 0;
  for (const child of root.children) total += walk(child);
  return total;
}

type Props = {
  initialSchemaId?: number | null;
  initialSchemas?: Array<{ id: number; name: string }>;
  initialState?: ClassificationStateDto | null;
  initialChainSteps?: LevelOrderEntity[];
};

export function CategoryWorkspace({
  initialSchemaId = null,
  initialSchemas = [],
  initialState = null,
  initialChainSteps = [],
}: Props = {}) {
  const store = useClassificationStore({
    initialSchemaId,
    initialSchemas,
    initialState,
    initialChainSteps,
  });
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('.mc-tree-filter') ||
        target?.closest('.mc-tree-context-menu') ||
        target?.closest('.mc-tree-tag-picker') ||
        target?.closest('.mc-tree-tag-edit-popover') ||
        target?.closest('.mc-tree-tag-overlay')
      ) {
        return;
      }
      store.closeOverlays();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [store.closeOverlays]);

  const contextNodeTags =
    store.contextMenu && store.state
      ? store.state.materialTags
          .filter((link) => link.materialNodeId === store.contextMenu?.nodeId)
          .map((link) => {
            const tag = store.state?.tags.find((entry) => entry.id === link.tagId);
            return {
              id: link.tagId,
              name: link.tagName,
              color: tag?.color ?? null,
            };
          })
      : [];

  const contextInheritedTags =
    store.contextMenu && store.state
      ? getInheritedTagsForNode(store.state, store.treeIndex, store.contextMenu.nodeId)
      : [];

  const contextAllTags = store.state?.tags ?? [];

  const searchMatchCount = countSearchMatches(store.treeRoot);
  const rootDropActive = store.dragSourceIds.length > 0;

  return (
    <div className="mc-dual-shell" ref={shellRef} style={{ ['--mc-sidebar-width' as string]: `${store.drawerWidthPx}px` }}>
      <aside className="mc-dual-shell__sidebar mc-side-card mc-side-card--tree" aria-label="Category hierarchy">
        <CategoryTreeHeader
          exporting={store.exporting}
          categoryCount={store.categoryCount}
          onBulkAdd={() => {
            store.setBulkOpen(true);
            store.closeOverlays();
          }}
          onImport={() => {
            store.setImportPromptOpen(true);
            store.closeOverlays();
          }}
          onExport={store.exportTreeCsv}
        />

        <div className="mc-tree-pane">
          <div className="mc-tree-shell">
            <CategorySearchStrip
              search={store.search}
              searchMatchCount={searchMatchCount}
              filterOpen={store.filterOpen}
              filterActive={store.filterActive}
              filterLabel={store.filterLabel}
              bulkActionLabel={store.filterBulkActionLabel}
              availableTags={store.availableTags}
              allTags={store.state?.tags ?? []}
              onSearchChange={store.setSearch}
              onClearSearch={() => store.setSearch('')}
              onToggleFilter={() => store.setFilterOpen(!store.filterOpen)}
              onToggleFilterOption={store.toggleFilterOption}
              onToggleFilterBulkSelection={store.toggleFilterBulkSelection}
              onToggleFilterTag={store.toggleFilterTag}
              onClearFilterTags={store.clearFilterTags}
              isFilterOptionSelected={store.isFilterOptionSelected}
              isFilterTagSelected={store.isFilterTagSelected}
              onUpdateTag={(tag) => {
                void store.updateTag(tag.id, tag.name, tag.color ?? null);
              }}
              onDeleteTag={(tagId) => {
                const tag = store.state?.tags.find((entry) => entry.id === tagId);
                const label = tag?.name ?? 'this tag';
                if (
                  !window.confirm(
                    `Delete tag "${label}" from all categories? This cannot be undone.`,
                  )
                ) {
                  return;
                }
                void store.deleteTagById(tagId);
              }}
              treeFullyExpanded={store.treeFullyExpanded}
              onToggleExpandCollapse={store.toggleExpandCollapseAll}
              showParentContext={store.showParentContext}
              onToggleShowParentContext={store.toggleShowParentContext}
            />

            {store.loading ? (
              <div className="mc-tree-empty">
                <span>Loading categories…</span>
                <span className="text-xs text-muted-foreground">First load can take a few seconds.</span>
              </div>
            ) : store.error && !store.state ? (
              <div className="mc-tree-empty">
                <strong>Unable to load the hierarchy.</strong>
                <span>{store.error}</span>
                <button
                  type="button"
                  className="mc-link-btn mc-tree-link-btn"
                  onClick={() => void store.refreshState()}
                >
                  Retry
                </button>
              </div>
            ) : store.treeRoot && store.treeRoot.children.length === 0 && store.search.trim() ? (
              <div className="mc-tree-empty">
                <span>No matching nodes. Try another keyword.</span>
                <button type="button" className="mc-link-btn mc-tree-link-btn" onClick={() => store.setSearch('')}>
                  Clear search
                </button>
              </div>
            ) : store.treeRoot && store.treeRoot.children.length === 0 && store.categoryCount === 0 ? (
              <div className="mc-tree-empty">
                <span>No categories yet.</span>
              </div>
            ) : store.treeRoot && store.treeRoot.children.length === 0 ? (
              <div className="mc-tree-empty">
                <span>Categories are hidden by the current filters.</span>
                <button type="button" className="mc-link-btn mc-tree-link-btn" onClick={store.resetTreeFilters}>
                  Reset filters
                </button>
              </div>
            ) : (
              <div
                className="mc-tree-canvas"
                onDragOver={(event) => {
                  if (store.dragSourceIds.length === 0) return;
                  event.preventDefault();
                }}
              >
                <CategoryExplorerTree
                  root={store.treeRoot}
                  store={{
                    expandedIds: store.expandedIds,
                    selectedNodeId: store.selectedNodeId,
                    search: store.search,
                    inline: store.inline,
                    dragSourceIds: store.dragSourceIds,
                    setInline: store.setInline,
                    toggleExpanded: store.toggleExpanded,
                    setSelectedNodeId: store.setSelectedNodeId,
                    startInlineCreate: store.startInlineCreate,
                    startInlineRename: store.startInlineRename,
                    commitInline: store.commitInline,
                    cancelInline: store.cancelInline,
                    openContextMenu: store.openContextMenu,
                    startDrag: store.startDrag,
                    updateDropTarget: store.updateDropTarget,
                    commitDrop: store.commitDrop,
                    clearDragState: store.clearDragState,
                  }}
                />
              </div>
            )}

            {!store.loading && !(store.error && store.categoryCount === 0) && (
              <div
                className={`mc-tree-footer ${rootDropActive ? 'is-drop-target' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  store.updateDropTarget(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void store.commitDrop(null);
                }}
              >
                <button
                  type="button"
                  className="mc-tree-footer__action"
                  disabled={store.inline?.mode === 'create' && store.inline.parentId == null}
                  onClick={() => store.startInlineCreate(null)}
                >
                  <span className="mc-tree-footer__plus">+</span>
                  <span>Add main category</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="mc-dual-shell__divider"
        aria-label="Resize category panel"
        title="Drag to resize panels"
        onPointerDown={(event) => {
          event.preventDefault();
          const startX = event.clientX;
          const startWidth = store.drawerWidthPx;
          const onMove = (moveEvent: PointerEvent) => {
            const next = Math.min(720, Math.max(280, startWidth + (moveEvent.clientX - startX)));
            store.setDrawerWidthPx(next);
          };
          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        }}
      >
        <span className="mc-dual-shell__divider-line" aria-hidden="true" />
      </button>

      <section className="mc-dual-shell__main">
        {store.error && store.categoryCount > 0 && (
          <div className="mc-tree-context-error" role="alert">
            <span>{store.error}</span>
            <button
              type="button"
              className="mc-tree-context-error__dismiss"
              aria-label="Dismiss error"
              onClick={() => store.setError(null)}
            >
              ×
            </button>
          </div>
        )}
        <div className="mc-level-panel-host">
          <CategoryLevelGridPanel
            parentPath={store.selectedPath}
            canAdd={store.canAddChildAtSelected}
            existingChildNodes={store.existingChildNodes}
            applying={store.creatingChildNodes}
            saving={store.updatingChildNodes}
            deleting={store.deletingChildNodes}
            onApply={store.batchAddChildNodes}
            onSaveRenames={store.batchRenameChildNodes}
            onDeleteSelected={store.batchDeleteChildNodes}
            onSelectPathNode={store.setSelectedNodeId}
          />
        </div>
      </section>

      <CategoryBulkPanel
        open={store.bulkOpen}
        text={store.bulkText}
        preview={store.bulkPreview}
        canApply={store.canApplyBulk}
        importing={store.importing}
        onTextChange={store.setBulkText}
        onClose={() => store.setBulkOpen(false)}
        onApply={() => void store.submitBulkAdd()}
      />

      <CategoryImportPrompt
        open={store.importPromptOpen}
        onClose={() => store.setImportPromptOpen(false)}
        onFilePicked={async (file) => {
          store.setImportPromptOpen(false);
          try {
            const rows = await readImportRowsFromFile(file);
            store.setImportRows(rows);
            await store.previewImportedRows(rows);
            store.setImportDrawerOpen(true);
          } catch (err) {
            store.setError(err instanceof Error ? err.message : 'Failed to read import file');
          }
        }}
      />

      <CategoryImportDrawer
        open={store.importDrawerOpen}
        rows={store.importRows}
        preview={store.importPreview}
        importing={store.importing}
        onClose={() => {
          store.setImportDrawerOpen(false);
          store.setImportRows([]);
          store.setImportPreview(null);
        }}
        onCommit={() => void store.commitImportedRows()}
      />

      <CategoryContextMenu
        menu={store.contextMenu}
        nodeTags={contextNodeTags}
        inheritedTags={contextInheritedTags}
        allTags={contextAllTags}
        onClose={() => store.setContextMenu(null)}
        onRename={() => {
          if (store.contextMenu) store.startInlineRename(store.contextMenu.nodeId);
        }}
        onDelete={() => {
          if (!store.contextMenu) return;
          const label = store.contextMenu.label;
          if (
            !window.confirm(
              `Delete "${label}" and all its children? This cannot be undone.`,
            )
          ) {
            return;
          }
          void store.deleteNode(store.contextMenu.nodeId);
          store.setContextMenu(null);
        }}
        onAddChild={() => {
          if (store.contextMenu) {
            store.startInlineCreate(store.contextMenu.nodeId);
            store.setContextMenu(null);
          }
        }}
        onAssignTagById={(tagId) => {
          if (store.contextMenu) void store.assignTagById(store.contextMenu.nodeId, tagId);
        }}
        onRemoveTag={(tagId) => {
          if (store.contextMenu) void store.removeTag(store.contextMenu.nodeId, tagId);
        }}
        onCreateAndAssignTag={(name, color) => {
          if (store.contextMenu) void store.createAndAssignTag(store.contextMenu.nodeId, name, color);
        }}
      />
    </div>
  );
}
