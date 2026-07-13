'use client';

import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { parseSingleColumnFile, parseSingleColumnText } from '@/lib/parse-single-column-rows';
import { cn } from '@/lib/utils';

type GridRow = {
  id: string;
  name: string;
};

const INITIAL_DRAFT_ROW_COUNT = 10;
const NEXT_DRAFT_ROW_ID = INITIAL_DRAFT_ROW_COUNT + 1;

function createInitialDraftRows(): GridRow[] {
  return Array.from({ length: INITIAL_DRAFT_ROW_COUNT }, (_, index) => ({
    id: `draft-${index + 1}`,
    name: '',
  }));
}

export type ExistingChildNode = {
  id: number;
  name: string;
};

export type PathSegment = {
  id: number;
  name: string;
};

type Props = {
  parentPath: PathSegment[];
  canAdd: boolean;
  existingChildNodes: ExistingChildNode[];
  applying: boolean;
  saving: boolean;
  deleting: boolean;
  onApply: (names: string[]) => Promise<void>;
  onSaveRenames: (updates: Array<{ id: number; name: string }>) => Promise<void>;
  onDeleteSelected: (ids: number[]) => Promise<void>;
  onSelectPathNode: (nodeId: number) => void;
};

export function CategoryLevelGridPanel({
  parentPath,
  canAdd,
  existingChildNodes,
  applying,
  saving,
  deleting,
  onApply,
  onSaveRenames,
  onDeleteSelected,
  onSelectPathNode,
}: Props) {
  const nextDraftRowIdRef = useRef(NEXT_DRAFT_ROW_ID);
  const createEmptyRow = useCallback((): GridRow => {
    const id = `draft-${nextDraftRowIdRef.current}`;
    nextDraftRowIdRef.current += 1;
    return { id, name: '' };
  }, []);
  const resetDraftRows = useCallback((): GridRow[] => {
    nextDraftRowIdRef.current = NEXT_DRAFT_ROW_ID;
    return createInitialDraftRows();
  }, []);

  const [rows, setRows] = useState<GridRow[]>(createInitialDraftRows);
  const [selectedExistingIds, setSelectedExistingIds] = useState<Set<number>>(new Set());
  const [selectedNewRowIds, setSelectedNewRowIds] = useState<Set<string>>(new Set());
  const [editedNames, setEditedNames] = useState<Record<number, string>>({});
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedExistingIds(new Set());
    setSelectedNewRowIds(new Set());
    setEditedNames(Object.fromEntries(existingChildNodes.map((node) => [node.id, node.name])));
    setEditingNodeId(null);
    setError(null);
  }, [parentPath, existingChildNodes]);

  const existingKeys = useMemo(
    () => new Set(existingChildNodes.map((node) => node.name.toLowerCase())),
    [existingChildNodes],
  );

  const allExistingSelected =
    existingChildNodes.length > 0 &&
    existingChildNodes.every((node) => selectedExistingIds.has(node.id));

  const someExistingSelected = selectedExistingIds.size > 0 && !allExistingSelected;

  const allNewRowsSelected = rows.length > 0 && rows.every((row) => selectedNewRowIds.has(row.id));

  const someNewRowsSelected = selectedNewRowIds.size > 0 && !allNewRowsSelected;

  const renameUpdates = useMemo(() => {
    const updates: Array<{ id: number; name: string }> = [];
    for (const node of existingChildNodes) {
      const nextName = editedNames[node.id]?.trim() ?? '';
      if (!nextName || nextName === node.name) {
        continue;
      }
      updates.push({ id: node.id, name: nextName });
    }
    return updates;
  }, [editedNames, existingChildNodes]);

  const renameDuplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of existingChildNodes) {
      const key = (editedNames[node.id] ?? node.name).trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
  }, [editedNames, existingChildNodes]);

  const renameEmptyCount = useMemo(
    () =>
      existingChildNodes.filter((node) => !(editedNames[node.id] ?? node.name).trim()).length,
    [editedNames, existingChildNodes],
  );

  const namesToCreate = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const row of rows) {
      const name = row.name.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(name);
    }
    return result;
  }, [rows]);

  const duplicateNames = useMemo(
    () => namesToCreate.filter((name) => existingKeys.has(name.toLowerCase())),
    [namesToCreate, existingKeys],
  );

  const appendNames = useCallback(
    (names: string[]) => {
      if (!names.length) return;
      setRows((current) => {
        const nonEmpty = current.filter((row) => row.name.trim());
        const importedRows = names.map((name) => {
          const id = `draft-${nextDraftRowIdRef.current}`;
          nextDraftRowIdRef.current += 1;
          return { id, name };
        });
        const trailingRow = createEmptyRow();
        return [...nonEmpty, ...importedRows, trailingRow];
      });
      setError(null);
    },
    [createEmptyRow],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const text = event.clipboardData.getData('text/plain');
      if (!text.trim()) return;
      event.preventDefault();
      appendNames(parseSingleColumnText(text));
    },
    [appendNames],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        const names = await parseSingleColumnFile(file);
        if (!names.length) {
          setError('No category names found in the file.');
          return;
        }
        appendNames(names);
      } catch {
        setError('Could not read the Excel file.');
      }
    },
    [appendNames],
  );

  const toggleExisting = useCallback((nodeId: number, checked: boolean) => {
    setSelectedExistingIds((current) => {
      const next = new Set(current);
      if (checked) next.add(nodeId);
      else next.delete(nodeId);
      return next;
    });
  }, []);

  const toggleSelectAllExisting = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedExistingIds(new Set());
        return;
      }
      setSelectedExistingIds(new Set(existingChildNodes.map((node) => node.id)));
    },
    [existingChildNodes],
  );

  const toggleNewRow = useCallback((rowId: string, checked: boolean) => {
    setSelectedNewRowIds((current) => {
      const next = new Set(current);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  }, []);

  const toggleSelectAllNewRows = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedNewRowIds(new Set());
        return;
      }
      setSelectedNewRowIds(new Set(rows.map((row) => row.id)));
    },
    [rows],
  );

  const handleDeleteSelectedNewRows = () => {
    if (!selectedNewRowIds.size) return;
    setRows((current) => {
      const next = current.filter((row) => !selectedNewRowIds.has(row.id));
      return next.length ? next : [createEmptyRow()];
    });
    setSelectedNewRowIds(new Set());
  };

  const handleApply = async () => {
    if (!canAdd) {
      setError('This node cannot accept child categories.');
      return;
    }
    if (!namesToCreate.length) {
      setError('Enter at least one category name.');
      return;
    }
    if (duplicateNames.length) {
      setError(`Already exist: ${duplicateNames.join(', ')}`);
      return;
    }
    setError(null);
    try {
      await onApply(namesToCreate);
      setRows(resetDraftRows());
      setSelectedNewRowIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create categories.');
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedExistingIds.size) return;
    const count = selectedExistingIds.size;
    if (
      !window.confirm(
        `Delete ${count} categor${count === 1 ? 'y' : 'ies'}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await onDeleteSelected(Array.from(selectedExistingIds));
      setSelectedExistingIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete categories.');
    }
  };

  const handleSaveRenames = async () => {
    if (!renameUpdates.length) return;
    if (renameEmptyCount > 0) {
      setError('Category names cannot be empty.');
      return;
    }
    if (renameDuplicateNames.length) {
      setError(`Duplicate names: ${renameDuplicateNames.join(', ')}`);
      return;
    }
    setError(null);
    try {
      await onSaveRenames(renameUpdates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category names.');
    }
  };

  return (
    <div className="mc-level-panel" onPaste={handlePaste}>
      <header className="mc-level-panel__header">
        <div>
          <p className="mc-level-panel__eyebrow">Child categories under</p>
          <nav className="mc-level-panel__path" aria-label="Category path">
            {parentPath.length === 0 ? (
              <span className="mc-level-panel__path-placeholder">Select a category in the tree</span>
            ) : (
              parentPath.map((node, index) => {
                const isLast = index === parentPath.length - 1;
                return (
                  <span key={node.id} className="mc-level-panel__path-segment">
                    {index > 0 ? (
                      <span className="mc-level-panel__path-separator" aria-hidden="true">
                        {' / '}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={cn(
                        'mc-level-panel__path-link',
                        isLast && 'mc-level-panel__path-link--current',
                      )}
                      aria-current={isLast ? 'page' : undefined}
                      onClick={() => onSelectPathNode(node.id)}
                    >
                      {node.name}
                    </button>
                  </span>
                );
              })
            )}
          </nav>
        </div>
      </header>

      <div className="mc-level-panel__body">
        {parentPath.length > 0 ? (
          <section className="mc-level-panel__section mc-level-panel__section--existing">
            <div className="mc-level-panel__section-head">
              <h2 className="mc-level-panel__section-title">
                Existing
                <span className="mc-level-panel__count">{existingChildNodes.length}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving || renameUpdates.length === 0 || renameDuplicateNames.length > 0}
                  onClick={() => void handleSaveRenames()}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Save changes{renameUpdates.length ? ` (${renameUpdates.length})` : ''}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mc-level-panel__danger-btn"
                  disabled={deleting || selectedExistingIds.size === 0}
                  onClick={() => void handleDeleteSelected()}
                >
                {deleting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Delete selected ({selectedExistingIds.size})
              </Button>
              </div>
            </div>

            <div className="mc-level-panel__table-scroll">
              <table className="mc-level-panel__table">
                <thead>
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <Checkbox
                        checked={
                          existingChildNodes.length > 0
                            ? allExistingSelected
                              ? true
                              : someExistingSelected
                                ? 'indeterminate'
                                : false
                            : false
                        }
                        disabled={existingChildNodes.length === 0}
                        aria-label="Select all existing categories"
                        onCheckedChange={(checked) => toggleSelectAllExisting(checked === true)}
                      />
                    </th>
                    <th className="w-12 px-3 py-2">#</th>
                    <th className="px-3 py-2">Category name</th>
                  </tr>
                </thead>
                <tbody>
                  {existingChildNodes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No child categories yet.
                      </td>
                    </tr>
                  ) : (
                    existingChildNodes.map((node, index) => {
                    const checked = selectedExistingIds.has(node.id);
                    const checkboxId = `existing-category-${node.id}`;
                    const draftName = editedNames[node.id] ?? node.name;
                    const isDirty = draftName.trim() !== node.name;

                    return (
                      <tr
                        key={node.id}
                        className={cn(
                          'mc-level-panel__row',
                          checked && 'is-selected',
                          isDirty && 'is-dirty',
                        )}
                      >
                        <td className="px-3 py-2">
                          <Checkbox
                            id={checkboxId}
                            checked={checked}
                            aria-label={`Select ${node.name}`}
                            onCheckedChange={(value) => toggleExisting(node.id, value === true)}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                          {editingNodeId === node.id ? (
                            <Input
                              value={draftName}
                              aria-label={`Edit ${node.name}`}
                              disabled={saving}
                              autoFocus
                              className={cn(
                                'h-8 border-zinc-200 bg-white shadow-none focus-visible:ring-indigo-500/30',
                                isDirty && 'border-indigo-300 bg-indigo-50/80',
                              )}
                              onChange={(event) => {
                                const value = event.target.value;
                                setEditedNames((current) => ({
                                  ...current,
                                  [node.id]: value,
                                }));
                              }}
                              onBlur={() => setEditingNodeId(null)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  setEditingNodeId(null);
                                  void handleSaveRenames();
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  setEditedNames((current) => ({
                                    ...current,
                                    [node.id]: node.name,
                                  }));
                                  setEditingNodeId(null);
                                }
                              }}
                            />
                          ) : (
                            <div
                              className={cn(
                                'mc-level-panel__name-field',
                                isDirty && 'mc-level-panel__name-field--dirty',
                              )}
                              role="group"
                              aria-label={`Category ${node.name}`}
                              onClick={() => setEditingNodeId(node.id)}
                            >
                              <button
                                type="button"
                                className="mc-level-panel__name-link-text"
                                title="Open child categories"
                                aria-label={`Open child categories for ${node.name}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onSelectPathNode(node.id);
                                }}
                              >
                                {draftName}
                              </button>
                              <span className="mc-level-panel__name-field-spacer" aria-hidden="true" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {parentPath.length > 0 ? (
        <section className="mc-level-panel__section mc-level-panel__section--add">
          <div className="mc-level-panel__section-head">
            <h2 className="mc-level-panel__section-title">Add new</h2>
            <div className="mc-level-panel__toolbar">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                onClick={() => setRows((current) => [...current, createEmptyRow()])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add row
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mc-level-panel__danger-btn"
                disabled={!canAdd || selectedNewRowIds.size === 0}
                onClick={handleDeleteSelectedNewRows}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete selected ({selectedNewRowIds.size})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={(event) => void handleFileChange(event)}
              />
              <span className="mc-level-panel__hint">Paste from Excel with Ctrl+V</span>
            </div>
          </div>

          <div className="mc-level-panel__table-scroll mc-level-panel__table-scroll--grow">
            <table className="mc-level-panel__table">
              <thead>
                <tr>
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      checked={
                        allNewRowsSelected ? true : someNewRowsSelected ? 'indeterminate' : false
                      }
                      aria-label="Select all new category rows"
                      disabled={!canAdd}
                      onCheckedChange={(checked) => toggleSelectAllNewRows(checked === true)}
                    />
                  </th>
                  <th className="w-12 px-3 py-2">#</th>
                  <th className="px-3 py-2">Category name</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const checked = selectedNewRowIds.has(row.id);
                  const checkboxId = `new-category-${row.id}`;

                  return (
                  <tr
                    key={row.id}
                    className={cn('mc-level-panel__row', checked && 'is-selected')}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        disabled={!canAdd}
                        aria-label={`Select row ${index + 1}`}
                        onCheckedChange={(value) => toggleNewRow(row.id, value === true)}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={row.name}
                        placeholder="Category name"
                        disabled={!canAdd}
                        className="h-8 border-zinc-200 bg-white shadow-none focus-visible:ring-indigo-500/30"
                        onChange={(event) => {
                          const value = event.target.value;
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id ? { ...item, name: value } : item,
                            ),
                          );
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                        aria-label="Remove row"
                        disabled={rows.length <= 1}
                        onClick={() => {
                          setRows((current) => current.filter((item) => item.id !== row.id));
                          setSelectedNewRowIds((current) => {
                            const next = new Set(current);
                            next.delete(row.id);
                            return next;
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}
      </div>

      <footer className="mc-level-panel__footer">
        <div className="mc-level-panel__footer-meta">
          <span>{namesToCreate.length} to create</span>
          {duplicateNames.length ? (
            <span className="text-amber-700"> · {duplicateNames.length} duplicate(s)</span>
          ) : null}
        </div>
        <Button
          type="button"
          className="mc-level-panel__submit"
          disabled={!canAdd || applying || !namesToCreate.length || duplicateNames.length > 0}
          onClick={() => void handleApply()}
        >
          {applying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create categories'
          )}
        </Button>
      </footer>

      {error ? <p className="mc-level-panel__error">{error}</p> : null}
      {!canAdd && parentPath.length > 0 ? (
        <p className="mc-level-panel__warning">This node cannot accept child categories.</p>
      ) : null}
    </div>
  );
}
