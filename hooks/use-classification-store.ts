'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ImportResultDto, ClassificationStateDto } from '@/application/classification/dto';
import { buildCodeFromPath, getExpectedChildLevelTypeId } from '@/domain/classification/classification-policy';
import {
  buildMaterialClassificationTreeIndex,
  getNodePathLength,
} from '@/domain/classification/tree-index';
import type { LevelOrderEntity } from '@/domain/classification/entities';
import { buildBulkPreview } from '@/lib/category-bulk-parser';
import { downloadCategoryExportCsv } from '@/lib/category-export';
import {
  buildCategoryTreeRoot,
  collectAvailableTags,
  getExistingCategoryPaths,
  type CategoryExplorerTreeNode,
  type CategoryInlineState,
} from '@/lib/category-tree-builder';
import {
  getTreeFilterLabel,
  getTreeFilterSelectedModes,
  isTreeFilterActive,
  isTreeFilterOptionMode,
  normalizeTreeFilterMode,
  readStoredTreeFilter,
  readStoredTreeTagFilter,
  toggleTreeFilterBulkSelection,
  toggleTreeFilterOption,
  writeStoredTreeFilter,
  writeStoredTreeTagFilter,
  type CategoryTreeFilter,
  type TreeFilterOptionMode,
  TREE_FILTER_OPTION_MODES,
} from '@/lib/category-tree-filter';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type CategoryContextMenuState = {
  nodeId: number;
  label: string;
  x: number;
  y: number;
} | null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? `Empty response from ${url}`
        : `Request failed (${response.status} ${response.statusText})`,
    );
  }

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(
      `Invalid JSON from ${url} (${response.status}): ${text.slice(0, 120)}`,
    );
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload.data;
}

export function useClassificationStore(initialSchemaId?: number) {
  const [schemaId, setSchemaId] = useState<number | null>(initialSchemaId ?? null);
  const [schemas, setSchemas] = useState<Array<{ id: number; name: string }>>([]);
  const [state, setState] = useState<ClassificationStateDto | null>(null);
  const [chainSteps, setChainSteps] = useState<LevelOrderEntity[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryTreeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTagNames, setFilterTagNames] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [inline, setInline] = useState<CategoryInlineState>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importPromptOpen, setImportPromptOpen] = useState(false);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [importRows, setImportRows] = useState<Array<{ path: string[]; tags: string[] }>>([]);
  const [importPreview, setImportPreview] = useState<ImportResultDto | null>(null);
  const [contextMenu, setContextMenu] = useState<CategoryContextMenuState>(null);
  const [drawerWidthPx, setDrawerWidthPx] = useState(430);
  const [dragSourceIds, setDragSourceIds] = useState<number[]>([]);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [dropTargetInvalid, setDropTargetInvalid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creatingChildNodes, setCreatingChildNodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilter(readStoredTreeFilter());
    setFilterTagNames(readStoredTreeTagFilter());
  }, []);

  const refreshSchemas = useCallback(async () => {
    try {
      const rows = await fetchJson<Array<{ id: number; name: string }>>(
        '/api/classification/schemas',
      );
      setSchemas(rows);
      setSchemaId((current) => {
        if (current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to load schemas');
    }
  }, []);

  const refreshChainSteps = useCallback(async (activeSchemaId: number) => {
    const maps = await fetchJson<Array<{ levelTypeId: number; levelOrder: number; isRequired: boolean }>>(
      `/api/classification/schemas/${activeSchemaId}/level-maps`
    );
    setChainSteps(
      maps
        .sort((a, b) => a.levelOrder - b.levelOrder)
        .map((m) => ({ levelTypeId: m.levelTypeId, order: m.levelOrder, isRequired: m.isRequired ?? true }))
    );
  }, []);

  const refreshState = useCallback(async (activeSchemaId?: number | null) => {
    const id = activeSchemaId ?? schemaId;
    if (!id) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [next] = await Promise.all([
        fetchJson<ClassificationStateDto>(`/api/classification/state?schemaId=${id}`),
        refreshChainSteps(id),
      ]);
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classification state');
    } finally {
      setLoading(false);
    }
  }, [schemaId, refreshChainSteps]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refreshSchemas()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load schemas');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSchemas]);

  useEffect(() => {
    refreshState(schemaId).catch((err) => setError(err.message));
  }, [schemaId, refreshState]);

  const treeIndex = useMemo(() => {
    if (!state) return buildMaterialClassificationTreeIndex([]);
    const options = state.materials
      .filter((m) => m.schemaId === schemaId)
      .map((m) => ({
        id: m.id,
        name: m.name,
        materialLevelTypeId: m.levelTypeId,
        parentId: m.parentId,
        schemaId: m.schemaId,
        isActive: m.isActive,
      }));
    return buildMaterialClassificationTreeIndex(options);
  }, [state, schemaId]);

  const treeRoot = useMemo<CategoryExplorerTreeNode | null>(() => {
    if (!state || !schemaId) return null;
    return buildCategoryTreeRoot({
      state,
      schemaId,
      chainSteps,
      search,
      filter,
      tagFilterNames: filterTagNames,
      expandedIds,
      selectedId: selectedNodeId,
      selectedIds: selectedNodeIds,
      inline,
      dragSourceIds,
      dropTargetId,
      dropTargetInvalid,
    });
  }, [
    state,
    schemaId,
    chainSteps,
    search,
    filter,
    filterTagNames,
    expandedIds,
    selectedNodeId,
    selectedNodeIds,
    inline,
    dragSourceIds,
    dropTargetId,
    dropTargetInvalid,
  ]);

  const availableTags = useMemo(() => {
    if (!state || !schemaId) return [];
    return collectAvailableTags(state, schemaId);
  }, [state, schemaId]);

  const filterLabel = useMemo(() => getTreeFilterLabel(filter), [filter]);
  const filterActive = useMemo(
    () => isTreeFilterActive(filter, filterTagNames),
    [filter, filterTagNames]
  );

  const filterBulkActionLabel = useMemo(() => {
    const selected = getTreeFilterSelectedModes(filter);
    return selected.size === TREE_FILTER_OPTION_MODES.length ? 'Unselect All' : 'Select All';
  }, [filter]);

  const bulkPreview = useMemo(() => {
    if (!state || !schemaId) {
      return { rows: [], createCount: 0, existingCount: 0, tagCount: 0, errors: [], warnings: [] };
    }
    return buildBulkPreview(bulkText, getExistingCategoryPaths(state, schemaId));
  }, [bulkText, state, schemaId]);

  const canApplyBulk = bulkPreview.rows.length > 0 && bulkPreview.errors.length === 0;

  const selectedPathLabel = selectedNodeId
    ? (treeIndex.pathLabelById.get(selectedNodeId) ?? '')
    : '';

  const selectedCode = useMemo(() => {
    if (!state || !selectedNodeId) return '';
    const path = treeIndex.pathById.get(selectedNodeId) ?? [];
    const pathIds = path.map((node) => node.id);
    const levels = chainSteps.length
      ? chainSteps
      : path.map((node, index) => ({
          levelTypeId: node.materialLevelTypeId ?? index + 1,
          order: index + 1,
          isRequired: true,
        }));
    return buildCodeFromPath({
      levels,
      levelTypes: state.levelTypes,
      options: state.materials.map((m) => ({
        id: m.id,
        name: m.name,
        materialLevelTypeId: m.levelTypeId,
        parentId: m.parentId,
        schemaId: m.schemaId,
        value: m.value ? Number(m.value) : null,
      })),
      pathIds,
    });
  }, [state, selectedNodeId, treeIndex, chainSteps]);

  const nodeItems = useMemo(() => {
    if (!state || !selectedNodeId) return [];
    return state.materialItems.filter((item) => item.materialNodeId === selectedNodeId);
  }, [state, selectedNodeId]);

  const canAddChildAtSelected = useMemo(() => {
    if (!selectedNodeId) return false;
    if (!chainSteps.length) return true;
    return (
      getExpectedChildLevelTypeId(selectedNodeId, chainSteps, (nodeId) =>
        getNodePathLength(nodeId, treeIndex),
      ) != null
    );
  }, [selectedNodeId, chainSteps, treeIndex]);

  const existingSiblingNames = useMemo(() => {
    if (!selectedNodeId) return [];
    const children = treeIndex.childrenByParentId.get(selectedNodeId) ?? [];
    return children.map((child) => child.name);
  }, [selectedNodeId, treeIndex]);

  const categoryCount = useMemo(() => {
    if (!state || !schemaId) return 0;
    return state.materials.filter((m) => m.schemaId === schemaId && m.isActive).length;
  }, [state, schemaId]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const closeOverlays = useCallback(() => {
    setFilterOpen(false);
    setContextMenu(null);
  }, []);

  const updateFilter = useCallback((next: CategoryTreeFilter) => {
    const normalized = normalizeTreeFilterMode(next);
    setFilter(normalized);
    writeStoredTreeFilter(normalized);
  }, []);

  const toggleFilterOption = useCallback(
    (option: TreeFilterOptionMode) => {
      updateFilter(toggleTreeFilterOption(filter, option));
    },
    [filter, updateFilter]
  );

  const toggleFilterBulkSelection = useCallback(() => {
    updateFilter(toggleTreeFilterBulkSelection(filter));
  }, [filter, updateFilter]);

  const isFilterOptionSelected = useCallback(
    (option: TreeFilterOptionMode) => {
      if (filter === 'all') return true;
      if (filter === 'none') return false;
      if (isTreeFilterOptionMode(filter)) return filter === option;
      return filter
        .slice('custom:'.length)
        .split(',')
        .includes(option);
    },
    [filter]
  );

  const toggleFilterTag = useCallback((tagName: string) => {
    setFilterTagNames((current) => {
      const next = new Set(current);
      const key = tagName.trim().replace(/^#+/, '').toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeStoredTreeTagFilter(next);
      return next;
    });
  }, []);

  const clearFilterTags = useCallback(() => {
    setFilterTagNames(new Set());
    writeStoredTreeTagFilter([]);
  }, []);

  const isFilterTagSelected = useCallback(
    (tagName: string) => filterTagNames.has(tagName.trim().replace(/^#+/, '').toLowerCase()),
    [filterTagNames]
  );

  const toggleExpanded = useCallback((nodeId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!state || !schemaId) return;
    const ids = state.materials
      .filter((m) => m.schemaId === schemaId)
      .map((m) => m.id);
    setExpandedIds(new Set(ids));
  }, [state, schemaId]);

  const startInlineCreate = useCallback((parentId: number | null = null) => {
    setInline({ parentId, nodeId: null, mode: 'create', value: '', error: '' });
    if (parentId != null) {
      setExpandedIds((current) => new Set(current).add(parentId));
    }
    closeOverlays();
  }, [closeOverlays]);

  const startInlineRename = useCallback(
    (nodeId: number) => {
      const node = state?.materials.find((m) => m.id === nodeId);
      if (!node) return;
      setInline({ parentId: null, nodeId, mode: 'rename', value: node.name, error: '' });
      closeOverlays();
    },
    [state, closeOverlays]
  );

  const cancelInline = useCallback(() => setInline(null), []);

  const createSchema = useCallback(async (name: string) => {
    const row = await fetchJson<{ id: number; name: string }>('/api/classification/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await refreshSchemas();
    setSchemaId(row.id);
  }, [refreshSchemas]);

  const addRootNode = useCallback(
    async (name: string) => {
      if (!schemaId) return;
      const levelTypeId = chainSteps[0]?.levelTypeId ?? null;
      await fetchJson('/api/classification/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaId, name, parentId: null, levelTypeId }),
      });
      await refreshState(schemaId);
    },
    [schemaId, chainSteps, refreshState]
  );

  const addChildNode = useCallback(
    async (parentId: number, name: string) => {
      if (!schemaId || !state) return;
      const levelTypeId = getExpectedChildLevelTypeId(parentId, chainSteps, (nodeId) =>
        getNodePathLength(nodeId, treeIndex)
      );
      await fetchJson('/api/classification/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaId, name, parentId, levelTypeId }),
      });
      await refreshState(schemaId);
    },
    [schemaId, state, chainSteps, treeIndex, refreshState]
  );

  const renameNode = useCallback(
    async (nodeId: number, name: string) => {
      if (!schemaId || !state) return;
      const node = state.materials.find((m) => m.id === nodeId);
      if (!node) return;
      await fetchJson('/api/classification/nodes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nodeId,
          schemaId: node.schemaId,
          name,
          parentId: node.parentId,
          levelTypeId: node.levelTypeId,
          isActive: node.isActive,
        }),
      });
      await refreshState(schemaId);
    },
    [schemaId, state, refreshState]
  );

  const commitInline = useCallback(async () => {
    if (!inline || !schemaId) return;
    const name = inline.value.trim();
    if (!name) {
      setInline({ ...inline, error: 'Name is required.' });
      return;
    }
    try {
      if (inline.mode === 'create') {
        if (inline.parentId == null) {
          await addRootNode(name);
        } else {
          await addChildNode(inline.parentId, name);
        }
      } else if (inline.nodeId != null) {
        await renameNode(inline.nodeId, name);
      }
      setInline(null);
    } catch (err) {
      setInline({
        ...inline,
        error: err instanceof Error ? err.message : 'Save failed',
      });
    }
  }, [inline, schemaId, addRootNode, addChildNode, renameNode]);

  const reparentNode = useCallback(
    async (nodeId: number, newParentId: number | null) => {
      if (!schemaId || !state) return;
      const node = state.materials.find((m) => m.id === nodeId);
      if (!node) return;
      const levelTypeId =
        newParentId == null
          ? (chainSteps[0]?.levelTypeId ?? node.levelTypeId)
          : getExpectedChildLevelTypeId(newParentId, chainSteps, (id) =>
              getNodePathLength(id, treeIndex)
            );
      await fetchJson('/api/classification/nodes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nodeId,
          schemaId: node.schemaId,
          name: node.name,
          parentId: newParentId,
          levelTypeId,
          isActive: node.isActive,
        }),
      });
      await refreshState(schemaId);
    },
    [schemaId, state, chainSteps, treeIndex, refreshState]
  );

  const deleteNode = useCallback(
    async (nodeId: number) => {
      if (!schemaId) return;
      await fetchJson(`/api/classification/nodes?id=${nodeId}`, { method: 'DELETE' });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      setSelectedNodeIds((current) => {
        const next = new Set(current);
        next.delete(nodeId);
        return next;
      });
      await refreshState(schemaId);
    },
    [schemaId, selectedNodeId, refreshState]
  );

  const ensureTagId = useCallback(async (tagName: string): Promise<number> => {
    const normalized = tagName.trim().replace(/^#+/, '');
    const existing = state?.tags.find((tag) => tag.name.toLowerCase() === normalized.toLowerCase());
    if (existing) return existing.id;
    const created = await fetchJson<{ id: number; name: string }>('/api/classification/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalized }),
    });
    return created.id;
  }, [state]);

  const assignTags = useCallback(
    async (nodeId: number, tagNames: string[]) => {
      if (!schemaId || !tagNames.length) return;
      for (const tagName of tagNames) {
        const tagId = await ensureTagId(tagName);
        await fetchJson('/api/classification/material-tags/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialNodeIds: [nodeId], tagId }),
        });
      }
      await refreshState(schemaId);
    },
    [schemaId, ensureTagId, refreshState]
  );

  const removeTag = useCallback(
    async (nodeId: number, tagId: number) => {
      if (!schemaId) return;
      await fetchJson('/api/classification/material-tags/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialNodeIds: [nodeId], tagId }),
      });
      await refreshState(schemaId);
    },
    [schemaId, refreshState]
  );

  const createMaterialItem = useCallback(
    async (fullName: string) => {
      if (!selectedNodeId || !schemaId) return;
      const path = treeIndex.pathById.get(selectedNodeId) ?? [];
      await fetchJson('/api/classification/material-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialNodeId: selectedNodeId,
          fullName,
          pathIds: path.map((node) => node.id).join(','),
        }),
      });
      await refreshState(schemaId);
    },
    [selectedNodeId, schemaId, treeIndex, refreshState]
  );

  const batchAddChildNodes = useCallback(
    async (names: string[]) => {
      if (!selectedNodeId || !schemaId || !state || !names.length) return;
      const levelTypeId = getExpectedChildLevelTypeId(selectedNodeId, chainSteps, (nodeId) =>
        getNodePathLength(nodeId, treeIndex),
      );
      setCreatingChildNodes(true);
      try {
        for (const name of names) {
          await fetchJson('/api/classification/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schemaId,
              name,
              parentId: selectedNodeId,
              levelTypeId,
            }),
          });
        }
        setExpandedIds((current) => new Set([...current, selectedNodeId]));
        await refreshState(schemaId);
      } finally {
        setCreatingChildNodes(false);
      }
    },
    [selectedNodeId, schemaId, state, chainSteps, treeIndex, refreshState],
  );

  const runImport = useCallback(
    async (rows: Array<{ path: string[]; tags: string[] }>, previewOnly = false) => {
      if (!schemaId) return null;
      const endpoint = previewOnly
        ? '/api/classification/import/preview'
        : '/api/classification/import';
      const result = await fetchJson<ImportResultDto>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaId, rows }),
      });
      if (!previewOnly && result.state) {
        setState(result.state);
      } else if (!previewOnly) {
        await refreshState(schemaId);
      }
      return result;
    },
    [schemaId, refreshState]
  );

  const submitBulkAdd = useCallback(async () => {
    if (!canApplyBulk) return;
    setImporting(true);
    try {
      const preview = await runImport(bulkPreview.rows, true);
      if (preview && preview.issues.some((issue) => issue.severity === 'error')) {
        throw new Error('Bulk import preview found errors.');
      }
      await runImport(bulkPreview.rows, false);
      setBulkOpen(false);
      setBulkText('');
    } finally {
      setImporting(false);
    }
  }, [canApplyBulk, bulkPreview.rows, runImport]);

  const previewImportedRows = useCallback(
    async (rows: Array<{ path: string[]; tags: string[] }>) => {
      const preview = await runImport(rows, true);
      setImportPreview(preview);
      return preview;
    },
    [runImport]
  );

  const commitImportedRows = useCallback(async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      await runImport(importRows, false);
      setImportDrawerOpen(false);
      setImportRows([]);
      setImportPreview(null);
    } finally {
      setImporting(false);
    }
  }, [importRows, runImport]);

  const exportTreeCsv = useCallback(() => {
    if (!state || !schemaId || exporting) return;
    setExporting(true);
    try {
      downloadCategoryExportCsv(state, schemaId);
    } finally {
      setExporting(false);
    }
  }, [state, schemaId, exporting]);

  const selectNode = useCallback((nodeId: number | null) => {
    if (nodeId == null) return;
    setSelectedNodeId(nodeId);
    setSelectedNodeIds(new Set([nodeId]));
    closeOverlays();
  }, [closeOverlays]);

  const openContextMenu = useCallback((nodeId: number, label: string, x: number, y: number) => {
    setContextMenu({ nodeId, label, x, y });
    setFilterOpen(false);
  }, []);

  const clearDragState = useCallback(() => {
    setDragSourceIds([]);
    setDropTargetId(null);
    setDropTargetInvalid(false);
  }, []);

  const startDrag = useCallback((nodeIds: number[]) => {
    setDragSourceIds(nodeIds);
  }, []);

  const updateDropTarget = useCallback((nodeId: number | null, invalid = false) => {
    setDropTargetId(nodeId);
    setDropTargetInvalid(invalid);
  }, []);

  const commitDrop = useCallback(
    async (targetParentId: number | null) => {
      const sourceId = dragSourceIds[0];
      if (sourceId == null) return;
      if (targetParentId === sourceId) {
        clearDragState();
        return;
      }
      const descendants = treeIndex.descendantIdsById.get(sourceId) ?? [];
      if (targetParentId != null && descendants.includes(targetParentId)) {
        clearDragState();
        return;
      }
      await reparentNode(sourceId, targetParentId);
      clearDragState();
    },
    [dragSourceIds, treeIndex, reparentNode, clearDragState]
  );

  return {
    schemaId,
    setSchemaId,
    schemas,
    state,
    chainSteps,
    loading,
    error,
    setError,
    search,
    setSearch,
    filter,
    filterOpen,
    setFilterOpen,
    filterLabel,
    filterActive,
    filterBulkActionLabel,
    filterTagNames,
    availableTags,
    treeIndex,
    treeRoot,
    categoryCount,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    selectedNodeId,
    setSelectedNodeId: selectNode,
    selectedNodeIds,
    selectedPathLabel,
    selectedCode,
    nodeItems,
    canAddChildAtSelected,
    existingSiblingNames,
    creatingChildNodes,
    inline,
    setInline,
    startInlineCreate,
    startInlineRename,
    cancelInline,
    commitInline,
    bulkOpen,
    setBulkOpen,
    bulkText,
    setBulkText,
    bulkPreview,
    canApplyBulk,
    importPromptOpen,
    setImportPromptOpen,
    importDrawerOpen,
    setImportDrawerOpen,
    importRows,
    setImportRows,
    importPreview,
    setImportPreview,
    contextMenu,
    setContextMenu,
    drawerWidthPx,
    setDrawerWidthPx,
    exporting,
    importing,
    refreshState,
    createSchema,
    addRootNode,
    addChildNode,
    renameNode,
    deleteNode,
    reparentNode,
    assignTags,
    removeTag,
    createMaterialItem,
    batchAddChildNodes,
    runImport,
    submitBulkAdd,
    previewImportedRows,
    commitImportedRows,
    exportTreeCsv,
    closeOverlays,
    toggleFilterOption,
    toggleFilterBulkSelection,
    isFilterOptionSelected,
    toggleFilterTag,
    clearFilterTags,
    isFilterTagSelected,
    openContextMenu,
    dragSourceIds,
    startDrag,
    updateDropTarget,
    commitDrop,
    clearDragState,
  };
}
