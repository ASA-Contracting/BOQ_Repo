'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { filterCatalogTagRecords } from '@/lib/category-tag-display';
import {
  getTreeFilterLabel,
  getTreeFilterSelectedModes,
  isTreeFilterActive,
  isTreeFilterOptionMode,
  normalizeTreeFilterMode,
  readStoredTreeFilter,
  readStoredTreeTagFilter,
  readStoredShowParentContext,
  toggleTreeFilterBulkSelection,
  toggleTreeFilterOption,
  writeStoredTreeFilter,
  writeStoredTreeTagFilter,
  writeStoredShowParentContext,
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

export type ClassificationStoreInitial = {
  initialSchemaId?: number | null;
  initialSchemas?: Array<{ id: number; name: string }>;
  initialState?: ClassificationStateDto | null;
  initialChainSteps?: LevelOrderEntity[];
};

const STATE_FETCH_TIMEOUT_MS = 60000;
const NETWORK_RETRY_DELAY_MS = 1500;

function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message === 'Failed to fetch' ||
    error.message.startsWith('Could not reach the server')
  );
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = STATE_FETCH_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
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
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Try refreshing the page.');
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Could not reach the server. Hard-refresh the page (Ctrl+Shift+R), especially after a dev server restart.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = STATE_FETCH_TIMEOUT_MS,
): Promise<T> {
  try {
    return await fetchJson<T>(url, init, timeoutMs);
  } catch (error) {
    if (!isTransientNetworkError(error)) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
    return fetchJson<T>(url, init, timeoutMs);
  }
}

function classificationStateUrl(schemaId: number, lite = true): string {
  const params = new URLSearchParams({
    schemaId: String(schemaId),
    ...(lite ? { lite: '1' } : {}),
  });
  return `/api/classification/state?${params.toString()}`;
}

export function useClassificationStore(initial?: ClassificationStoreInitial) {
  const hasInitialSnapshot = initial?.initialState != null && initial.initialSchemaId != null;
  const hasInitialSchemaContext =
    initial?.initialSchemaId != null && (initial.initialSchemas?.length ?? 0) > 0;

  const [schemaId, setSchemaId] = useState<number | null>(
    initial?.initialSchemaId ?? null,
  );
  const [schemas, setSchemas] = useState<Array<{ id: number; name: string }>>(
    initial?.initialSchemas ?? [],
  );
  const [state, setState] = useState<ClassificationStateDto | null>(
    initial?.initialState ?? null,
  );
  const [chainSteps, setChainSteps] = useState<LevelOrderEntity[]>(
    initial?.initialChainSteps ?? [],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryTreeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTagNames, setFilterTagNames] = useState<Set<string>>(new Set());
  const [showParentContext, setShowParentContextState] = useState(false);
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
  const [updatingChildNodes, setUpdatingChildNodes] = useState(false);
  const [deletingChildNodes, setDeletingChildNodes] = useState(false);
  const [loading, setLoading] = useState(!hasInitialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const loadedSchemaIdRef = useRef<number | null>(initial?.initialSchemaId ?? null);

  useEffect(() => {
    setFilter(readStoredTreeFilter());
    setFilterTagNames(readStoredTreeTagFilter());
    setShowParentContextState(readStoredShowParentContext());
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

  const loadLiteState = useCallback(async (id: number) => {
    return fetchJson<ClassificationStateDto>(classificationStateUrl(id));
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
      const next = await loadLiteState(id);
      setState(next);
      void refreshChainSteps(id).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classification state');
    } finally {
      setLoading(false);
    }
  }, [schemaId, loadLiteState, refreshChainSteps]);

  useEffect(() => {
    if (hasInitialSnapshot) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        let activeSchemaId = initial?.initialSchemaId ?? loadedSchemaIdRef.current;

        if (!hasInitialSchemaContext) {
          const rows = await fetchJsonWithRetry<Array<{ id: number; name: string }>>(
            '/api/classification/schemas',
          );
          if (cancelled) return;

          setSchemas(rows);
          activeSchemaId =
            rows.find((row) => row.id === activeSchemaId)?.id ?? rows[0]?.id ?? null;
          setSchemaId(activeSchemaId);
        }

        loadedSchemaIdRef.current = activeSchemaId;

        if (!activeSchemaId) {
          setState(null);
          return;
        }

        const next = await fetchJsonWithRetry<ClassificationStateDto>(
          classificationStateUrl(activeSchemaId),
        );
        if (cancelled) return;
        setState(next);
        void refreshChainSteps(activeSchemaId).catch(() => undefined);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classification data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [hasInitialSnapshot, hasInitialSchemaContext, initial?.initialSchemaId, refreshChainSteps]);

  useEffect(() => {
    if (loading || !state || !schemaId) return;
    const materialCount = state.materials.filter(
      (material) => material.schemaId === schemaId && material.isActive,
    ).length;
    if (materialCount === 0) return;

    const root = buildCategoryTreeRoot({
      state,
      schemaId,
      chainSteps,
      search,
      filter,
      tagFilterNames: filterTagNames,
      showParentContext,
      expandedIds,
      selectedId: selectedNodeId,
      selectedIds: selectedNodeIds,
      inline,
      dragSourceIds,
      dropTargetId,
      dropTargetInvalid,
    });

    if (root.children.length > 0) return;
    if (filter === 'all' && filterTagNames.size === 0 && !search.trim()) return;

    setFilter('all');
    writeStoredTreeFilter('all');
    setFilterTagNames(new Set());
    writeStoredTreeTagFilter([]);
    setSearch('');
  }, [
    loading,
    state,
    schemaId,
    chainSteps,
    search,
    filter,
    filterTagNames,
    showParentContext,
    expandedIds,
    selectedNodeId,
    selectedNodeIds,
    inline,
    dragSourceIds,
    dropTargetId,
    dropTargetInvalid,
  ]);

  useEffect(() => {
    if (!schemaId || schemaId === loadedSchemaIdRef.current) {
      return;
    }
    loadedSchemaIdRef.current = schemaId;
    void refreshState(schemaId);
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
      showParentContext,
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
    showParentContext,
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

  const catalogTags = useMemo(() => {
    if (!state || !schemaId) return [];
    return filterCatalogTagRecords(state.tags, state, schemaId);
  }, [state, schemaId]);

  const filterLabel = useMemo(() => getTreeFilterLabel(filter), [filter]);
  const filterActive = useMemo(
    () => isTreeFilterActive(filter, filterTagNames),
    [filter, filterTagNames],
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

  const selectedPath = useMemo(() => {
    if (!selectedNodeId) return [];
    return (treeIndex.pathById.get(selectedNodeId) ?? []).map((node) => ({
      id: node.id,
      name: node.name,
    }));
  }, [selectedNodeId, treeIndex]);

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

  const canAddChildAtSelected = useMemo(() => {
    if (!selectedNodeId) return false;
    if (!chainSteps.length) return true;
    return (
      getExpectedChildLevelTypeId(selectedNodeId, chainSteps, (nodeId) =>
        getNodePathLength(nodeId, treeIndex),
      ) != null
    );
  }, [selectedNodeId, chainSteps, treeIndex]);

  const existingChildNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const children = treeIndex.childrenByParentId.get(selectedNodeId) ?? [];
    return children.map((child) => ({ id: child.id, name: child.name }));
  }, [selectedNodeId, treeIndex]);

  const categoryCount = useMemo(() => {
    if (!state || !schemaId) return 0;
    return state.materials.filter((m) => m.schemaId === schemaId && m.isActive).length;
  }, [state, schemaId]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const expandableNodeIds = useMemo(() => {
    if (!state || !schemaId) return [];
    const active = state.materials.filter((m) => m.schemaId === schemaId && m.isActive);
    const parentIds = new Set<number>();
    for (const node of active) {
      if (node.parentId != null) {
        parentIds.add(node.parentId);
      }
    }
    return [...parentIds];
  }, [state, schemaId]);

  const treeFullyExpanded = useMemo(
    () =>
      expandableNodeIds.length > 0 && expandableNodeIds.every((id) => expandedIds.has(id)),
    [expandableNodeIds, expandedIds],
  );

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

  const resetTreeFilters = useCallback(() => {
    setSearch('');
    setFilter('all');
    writeStoredTreeFilter('all');
    setFilterTagNames(new Set());
    writeStoredTreeTagFilter([]);
  }, []);

  const setShowParentContext = useCallback((enabled: boolean) => {
    setShowParentContextState(enabled);
    writeStoredShowParentContext(enabled);
  }, []);

  const toggleShowParentContext = useCallback(() => {
    setShowParentContextState((current) => {
      const next = !current;
      writeStoredShowParentContext(next);
      return next;
    });
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

  const toggleExpandCollapseAll = useCallback(() => {
    if (treeFullyExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  }, [treeFullyExpanded, collapseAll, expandAll]);

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
      try {
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
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move category');
      }
    },
    [schemaId, state, chainSteps, treeIndex, refreshState]
  );

  const deleteNode = useCallback(
    async (nodeId: number) => {
      if (!schemaId) return;
      try {
        await fetchJson(`/api/classification/nodes?id=${nodeId}`, { method: 'DELETE' });
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
        setSelectedNodeIds((current) => {
          const next = new Set(current);
          next.delete(nodeId);
          return next;
        });
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
    },
    [schemaId, selectedNodeId, refreshState]
  );

  const createTag = useCallback(
    async (name: string, color?: string | null): Promise<{ id: number; name: string; color?: string | null }> => {
      const normalized = name.trim().replace(/^#+/, '');
      if (!normalized) throw new Error('Tag name is required');
      const existing = state?.tags.find((tag) => tag.name.toLowerCase() === normalized.toLowerCase());
      if (existing) return existing;
      const created = await fetchJson<{ id: number; name: string; color?: string | null }>(
        '/api/classification/tags',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalized, color: color ?? null }),
        },
      );
      if (schemaId) {
        await refreshState(schemaId);
      }
      return created;
    },
    [state, schemaId, refreshState],
  );

  const ensureTagId = useCallback(
    async (tagName: string, color?: string | null): Promise<number> => {
      const created = await createTag(tagName, color);
      return created.id;
    },
    [createTag],
  );

  const assignTagById = useCallback(
    async (nodeId: number, tagId: number) => {
      if (!schemaId) return;
      try {
        await fetchJson('/api/classification/material-tags/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialNodeIds: [nodeId], tagId }),
        });
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign tag');
        throw err;
      }
    },
    [schemaId, refreshState],
  );

  const assignTags = useCallback(
    async (nodeId: number, tagNames: string[], color?: string | null) => {
      if (!schemaId || !tagNames.length) return;
      try {
        for (const tagName of tagNames) {
          const tagId = await ensureTagId(tagName, color);
          await fetchJson('/api/classification/material-tags/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materialNodeIds: [nodeId], tagId }),
          });
        }
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign tags');
      }
    },
    [schemaId, ensureTagId, refreshState],
  );

  const createAndAssignTag = useCallback(
    async (nodeId: number, name: string, color?: string | null) => {
      if (!schemaId) return;
      try {
        const tag = await createTag(name, color);
        await assignTagById(nodeId, tag.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create and assign tag');
      }
    },
    [schemaId, createTag, assignTagById],
  );

  const removeTag = useCallback(
    async (nodeId: number, tagId: number) => {
      if (!schemaId) return;
      try {
        await fetchJson('/api/classification/material-tags/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialNodeIds: [nodeId], tagId }),
        });
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove tag');
      }
    },
    [schemaId, refreshState]
  );

  const updateTag = useCallback(
    async (tagId: number, name: string, color?: string | null) => {
      if (!schemaId) return;
      const normalized = name.trim().replace(/^#+/, '');
      if (!normalized) return;
      try {
        await fetchJson('/api/classification/tags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tagId, name: normalized, color: color ?? null }),
        });
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update tag');
      }
    },
    [schemaId, refreshState],
  );

  const renameTag = useCallback(
    async (tagId: number, name: string) => {
      const existing = state?.tags.find((tag) => tag.id === tagId);
      await updateTag(tagId, name, existing?.color ?? null);
    },
    [state, updateTag],
  );

  const deleteTagById = useCallback(
    async (tagId: number) => {
      if (!schemaId) return;
      try {
        await fetchJson(`/api/classification/tags?id=${tagId}`, { method: 'DELETE' });
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tag');
      }
    },
    [schemaId, refreshState]
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
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create categories');
        throw err;
      } finally {
        setCreatingChildNodes(false);
      }
    },
    [selectedNodeId, schemaId, state, chainSteps, treeIndex, refreshState],
  );

  const batchRenameChildNodes = useCallback(
    async (updates: Array<{ id: number; name: string }>) => {
      if (!schemaId || !updates.length) return;
      setUpdatingChildNodes(true);
      try {
        for (const update of updates) {
          await renameNode(update.id, update.name);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename categories');
        throw err;
      } finally {
        setUpdatingChildNodes(false);
      }
    },
    [schemaId, renameNode],
  );

  const batchDeleteChildNodes = useCallback(
    async (nodeIds: number[]) => {
      if (!schemaId || !nodeIds.length) return;
      setDeletingChildNodes(true);
      try {
        for (const nodeId of nodeIds) {
          await fetchJson(`/api/classification/nodes?id=${nodeId}`, { method: 'DELETE' });
        }
        await refreshState(schemaId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete categories');
        throw err;
      } finally {
        setDeletingChildNodes(false);
      }
    },
    [schemaId, refreshState],
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk import failed');
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
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
    setExpandedIds((current) => {
      const next = new Set(current);
      const path = treeIndex.pathById.get(nodeId) ?? [];
      for (const node of path) {
        if (node.id !== nodeId) {
          next.add(node.id);
        }
      }
      return next;
    });
    closeOverlays();
  }, [closeOverlays, treeIndex]);

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
    showParentContext,
    setShowParentContext,
    toggleShowParentContext,
    availableTags,
    catalogTags,
    treeIndex,
    treeRoot,
    categoryCount,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    treeFullyExpanded,
    toggleExpandCollapseAll,
    selectedNodeId,
    setSelectedNodeId: selectNode,
    selectedNodeIds,
    selectedPathLabel,
    selectedPath,
    selectedCode,
    canAddChildAtSelected,
    existingChildNodes,
    creatingChildNodes,
    updatingChildNodes,
    deletingChildNodes,
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
    assignTagById,
    createAndAssignTag,
    createTag,
    removeTag,
    updateTag,
    renameTag,
    deleteTagById,
    batchAddChildNodes,
    batchRenameChildNodes,
    batchDeleteChildNodes,
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
    resetTreeFilters,
    isFilterTagSelected,
    openContextMenu,
    dragSourceIds,
    startDrag,
    updateDropTarget,
    commitDrop,
    clearDragState,
  };
}
