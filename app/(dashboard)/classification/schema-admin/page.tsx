'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_CLASSIFICATION_SCHEMA_LEVELS } from '@/domain/classification/constants';

type LevelType = {
  id: number;
  name: string;
  prefix?: string | null;
  suffix?: string | null;
  isNumeric: boolean;
};

type Schema = { id: number; name: string };
type LevelMap = { levelTypeId: number; levelOrder: number; isRequired: boolean; levelTypeName?: string };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.message || 'Request failed');
  return payload.data as T;
}

export default function SchemaAdminPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [schemaId, setSchemaId] = useState<number | null>(null);
  const [levelTypes, setLevelTypes] = useState<LevelType[]>([]);
  const [maps, setMaps] = useState<LevelMap[]>([]);
  const [draftLevels, setDraftLevels] = useState<
    Array<{ levelTypeId: number; order: number; isRequired: boolean }>
  >([]);

  const refresh = async () => {
    const [schemaRows, typeRows] = await Promise.all([
      fetchJson<Schema[]>('/api/classification/schemas'),
      fetchJson<LevelType[]>('/api/classification/level-types'),
    ]);
    setSchemas(schemaRows);
    setLevelTypes(typeRows);
    const activeSchemaId = schemaId ?? schemaRows[0]?.id ?? null;
    setSchemaId(activeSchemaId);
    if (activeSchemaId) {
      const mapRows = await fetchJson<LevelMap[]>(
        `/api/classification/schemas/${activeSchemaId}/level-maps`
      );
      setMaps(mapRows);
      setDraftLevels(
        mapRows
          .sort((a, b) => a.levelOrder - b.levelOrder)
          .map((map) => ({
            levelTypeId: map.levelTypeId,
            order: map.levelOrder,
            isRequired: map.isRequired,
          }))
      );
    }
  };

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  useEffect(() => {
    if (!schemaId) return;
    fetchJson<LevelMap[]>(`/api/classification/schemas/${schemaId}/level-maps`)
      .then((mapRows) => {
        setMaps(mapRows);
        setDraftLevels(
          mapRows
            .sort((a, b) => a.levelOrder - b.levelOrder)
            .map((map) => ({
              levelTypeId: map.levelTypeId,
              order: map.levelOrder,
              isRequired: map.isRequired,
            }))
        );
      })
      .catch(console.error);
  }, [schemaId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Schema admin</h1>
        <p className="text-sm text-zinc-500">Manage level types and schema level order.</p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium">Level types</h2>
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            await fetchJson('/api/classification/level-types', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: String(data.get('name')),
                prefix: String(data.get('prefix') || ''),
                suffix: String(data.get('suffix') || ''),
                isNumeric: data.get('isNumeric') === 'on',
              }),
            });
            form.reset();
            await refresh();
          }}
        >
          <Input name="name" placeholder="Name (e.g. Discipline)" required />
          <Input name="prefix" placeholder="Prefix" />
          <Input name="suffix" placeholder="Suffix" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isNumeric" /> Numeric
          </label>
          <Button type="submit">Add level type</Button>
        </form>
        <ul className="space-y-1 text-sm">
          {levelTypes.map((type) => (
            <li key={type.id} className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              {type.name} {type.prefix ? `[${type.prefix}]` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">Schema level order</h2>
          <select
            className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
            value={schemaId ?? ''}
            onChange={(event) => setSchemaId(Number(event.target.value))}
          >
            {schemas.map((schema) => (
              <option key={schema.id} value={schema.id}>
                {schema.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 space-y-2">
          {draftLevels.map((level, index) => (
            <div key={`${level.levelTypeId}-${index}`} className="flex flex-wrap items-center gap-2">
              <span className="w-8 text-sm text-zinc-500">{index + 1}</span>
              <select
                className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-700"
                value={level.levelTypeId}
                onChange={(event) => {
                  const next = [...draftLevels];
                  next[index] = { ...next[index], levelTypeId: Number(event.target.value) };
                  setDraftLevels(next);
                }}
              >
                {levelTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={level.isRequired}
                  onChange={(event) => {
                    const next = [...draftLevels];
                    next[index] = { ...next[index], isRequired: event.target.checked };
                    setDraftLevels(next);
                  }}
                />
                Required
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraftLevels(draftLevels.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setDraftLevels([
                ...draftLevels,
                {
                  levelTypeId: levelTypes[0]?.id ?? 0,
                  order: draftLevels.length + 1,
                  isRequired: true,
                },
              ])
            }
            disabled={levelTypes.length === 0 || draftLevels.length >= MAX_CLASSIFICATION_SCHEMA_LEVELS}
          >
            Add level
          </Button>
          <Button
            onClick={async () => {
              if (!schemaId) return;
              await fetchJson(`/api/classification/schemas/${schemaId}/save-schema`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  levels: draftLevels.map((level, index) => ({
                    levelTypeId: level.levelTypeId,
                    order: index + 1,
                    isRequired: level.isRequired,
                  })),
                }),
              });
              await refresh();
            }}
            disabled={!schemaId || draftLevels.length === 0}
          >
            Save schema
          </Button>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          Current maps: {maps.map((map) => map.levelTypeName ?? map.levelTypeId).join(' → ')}
          {' · '}
          Up to {MAX_CLASSIFICATION_SCHEMA_LEVELS} levels ({draftLevels.length}/
          {MAX_CLASSIFICATION_SCHEMA_LEVELS} in draft)
        </div>
      </section>
    </div>
  );
}
