'use client';

import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseSingleColumnFile, parseSingleColumnText } from '@/lib/parse-single-column-rows';

type GridRow = {
  id: string;
  name: string;
};

type Props = {
  parentPathLabel: string;
  canAdd: boolean;
  existingSiblingNames: string[];
  applying: boolean;
  onApply: (names: string[]) => Promise<void>;
};

function createEmptyRow(): GridRow {
  return { id: crypto.randomUUID(), name: '' };
}

export function CategoryLevelGridPanel({
  parentPathLabel,
  canAdd,
  existingSiblingNames,
  applying,
  onApply,
}: Props) {
  const [rows, setRows] = useState<GridRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingKeys = useMemo(
    () => new Set(existingSiblingNames.map((name) => name.toLowerCase())),
    [existingSiblingNames],
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

  const appendNames = useCallback((names: string[]) => {
    if (!names.length) return;
    setRows((current) => {
      const nonEmpty = current.filter((row) => row.name.trim());
      const next = [
        ...nonEmpty,
        ...names.map((name) => ({ id: crypto.randomUUID(), name })),
        createEmptyRow(),
      ];
      return next;
    });
    setError(null);
  }, []);

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
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create categories.');
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Add child categories under</p>
        <p className="text-sm font-medium">{parentPathLabel || 'Select a category node'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <span className="text-xs text-zinc-500">Paste from Excel with Ctrl+V</span>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="w-10 px-2 py-2">#</th>
              <th className="px-2 py-2">Category name</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="px-2 py-1.5 text-xs text-zinc-400">{index + 1}</td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.name}
                    placeholder="Category name"
                    disabled={!canAdd}
                    className="h-8"
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
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                    aria-label="Remove row"
                    disabled={rows.length <= 1}
                    onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {namesToCreate.length} to create
          {duplicateNames.length ? ` · ${duplicateNames.length} duplicate(s)` : ''}
        </p>
        <Button
          type="button"
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
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {!canAdd ? (
        <p className="text-sm text-amber-700">Select a node that can accept child categories.</p>
      ) : null}
    </div>
  );
}
