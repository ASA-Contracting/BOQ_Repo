'use client';

import * as XLSX from 'xlsx';
import type { ImportResultDto } from '@/application/classification/dto';

type ImportRow = { path: string[]; tags: string[] };

type Props = {
  open: boolean;
  rows: ImportRow[];
  preview: ImportResultDto | null;
  importing: boolean;
  onClose: () => void;
  onCommit: () => void;
};

function parseWorkbook(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function parseImportFileRows(rows: string[][]): ImportRow[] {
  if (!rows.length) return [];
  const header = rows[0].map((cell) => String(cell ?? '').trim().toLowerCase());
  const tagsIndex = header.findIndex((cell) => cell === 'tags');
  const levelHeaders = header
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell.startsWith('level '))
    .sort((left, right) => left.cell.localeCompare(right.cell));

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim()))
    .map((row) => {
      const cells = row.map((cell) => String(cell ?? '').trim());
      const path =
        levelHeaders.length > 0
          ? levelHeaders.map(({ index }) => cells[index]).filter(Boolean)
          : tagsIndex > 0
            ? cells.slice(0, tagsIndex).filter(Boolean)
            : cells.filter(Boolean);
      const tagsRaw = tagsIndex >= 0 ? cells[tagsIndex] ?? '' : '';
      const tags = tagsRaw
        .split(/[;,]/)
        .map((tag) => tag.trim().replace(/^#+/, ''))
        .filter(Boolean);
      return { path, tags };
    })
    .filter((row) => row.path.length > 0);
}

export async function readImportRowsFromFile(file: File): Promise<ImportRow[]> {
  const rows = await parseWorkbook(file);
  return parseImportFileRows(rows);
}

export function CategoryImportDrawer({ open, rows, preview, importing, onClose, onCommit }: Props) {
  if (!open) return null;

  const errorCount =
    preview?.issues.filter((issue) => issue.severity === 'error').length ?? 0;
  const warningCount =
    preview?.issues.filter((issue) => issue.severity === 'warning').length ?? 0;

  return (
    <div className="mc-import-drawer" onClick={onClose}>
      <div className="mc-import-drawer__panel" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Import preview</h3>
            <p className="text-sm text-zinc-500">{rows.length} row(s) mapped</p>
          </div>
          <button type="button" className="text-zinc-500" onClick={onClose}>
            ×
          </button>
        </div>
        {preview && (
          <div className="grid gap-2 text-sm">
            <span>New categories: {preview.newCategoryCount}</span>
            <span>Existing paths: {preview.existingPathCount}</span>
            <span>New tags: {preview.newTagCount}</span>
            {errorCount > 0 && <span className="text-red-600">Errors: {errorCount}</span>}
            {warningCount > 0 && <span className="text-amber-600">Warnings: {warningCount}</span>}
          </div>
        )}
        {preview?.issues.length ? (
          <div className="max-h-48 overflow-auto rounded border border-zinc-200 p-2 text-xs dark:border-zinc-700">
            {preview.issues.map((issue, index) => (
              <div
                key={`${issue.message}-${index}`}
                className={issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}
              >
                {issue.rowNumber ? `Row ${issue.rowNumber}: ` : ''}
                {issue.message}
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            disabled={importing || errorCount > 0 || rows.length === 0}
            onClick={onCommit}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
