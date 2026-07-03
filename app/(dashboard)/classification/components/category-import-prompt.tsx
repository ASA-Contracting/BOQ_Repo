'use client';

import { buildImportTemplateCsv } from '@/lib/category-bulk-parser';
import { Download } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onFilePicked: (file: File) => void;
};

export function CategoryImportPrompt({ open, onClose, onFilePicked }: Props) {
  if (!open) return null;

  const downloadTemplate = () => {
    const csv = buildImportTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'category-import-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Import Categories</h3>
        <p className="mt-1 text-sm text-zinc-500">Choose Excel or CSV file</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer rounded border px-3 py-2 text-sm font-medium">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onFilePicked(file);
                  event.target.value = '';
                }
              }}
            />
            Choose file
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4" />
            Download category template
          </button>
          <button type="button" className="rounded px-3 py-2 text-sm text-zinc-500" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
