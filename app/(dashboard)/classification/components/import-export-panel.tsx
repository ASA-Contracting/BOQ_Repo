'use client';

import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

type ImportRow = { path: string[]; tags: string[] };

type Props = {
  onImport: (rows: ImportRow[], previewOnly: boolean) => Promise<unknown>;
  onExport: () => Promise<void>;
};

function parseWorkbookRows(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
        const parsed: ImportRow[] = rows
          .filter((row) => row.some((cell) => String(cell ?? '').trim()))
          .map((row) => {
            const cells = row.map((cell) => String(cell ?? '').trim()).filter(Boolean);
            const tagsIndex = cells.findIndex((cell) => cell.toLowerCase() === 'tags');
            if (tagsIndex >= 0) {
              return {
                path: cells.slice(0, tagsIndex),
                tags: cells[tagsIndex + 1]?.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean) ?? [],
              };
            }
            const last = cells[cells.length - 1];
            const maybeTags = last.includes(';') || last.includes(',');
            return {
              path: maybeTags ? cells.slice(0, -1) : cells,
              tags: maybeTags ? last.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean) : [],
            };
          });
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function ImportExportPanel({ onImport, onExport }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <label className="inline-flex">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const rows = await parseWorkbookRows(file);
            const preview = await onImport(rows, true);
            const issueCount =
              typeof preview === 'object' &&
              preview &&
              'issues' in preview &&
              Array.isArray((preview as { issues: unknown[] }).issues)
                ? (preview as { issues: unknown[] }).issues.length
                : 0;
            if (issueCount > 0) {
              window.alert(`Import preview found ${issueCount} issue(s). Check console for details.`);
              console.log(preview);
              return;
            }
            if (window.confirm(`Import ${rows.length} row(s)?`)) {
              await onImport(rows, false);
            }
            event.target.value = '';
          }}
        />
        <Button type="button" variant="outline" asChild>
          <span>Import XLSX/CSV</span>
        </Button>
      </label>
      <Button type="button" variant="outline" onClick={() => onExport()}>
        Export CSV
      </Button>
    </div>
  );
}
