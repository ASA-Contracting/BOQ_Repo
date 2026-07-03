'use client';

import type { CategoryBulkPreview } from '@/lib/category-bulk-parser';

type Props = {
  open: boolean;
  text: string;
  preview: CategoryBulkPreview;
  canApply: boolean;
  importing: boolean;
  onTextChange: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
};

export function CategoryBulkPanel({
  open,
  text,
  preview,
  canApply,
  importing,
  onTextChange,
  onClose,
  onApply,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="mc-tree-bulk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Bulk add categories"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mc-tree-bulk-panel__head">
          <div>
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Categories</span>
            <strong className="block">Bulk add</strong>
          </div>
          <button type="button" className="mc-tree-bulk-panel__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <textarea
          className="mc-tree-bulk-panel__input"
          value={text}
          placeholder={'Air Handling Units/Chilled Water #hvac\nPlumbing #fire'}
          onChange={(event) => onTextChange(event.target.value)}
        />
        <div className="mc-tree-bulk-panel__example text-zinc-500">
          <span>Use /, &gt;, |, comma, or tab between levels. Add tags with #tag.</span>
        </div>
        <div className="mc-tree-bulk-panel__summary">
          <span>Create: {preview.createCount}</span>
          <span>Existing: {preview.existingCount}</span>
          <span>Tags: {preview.tagCount}</span>
        </div>
        {preview.errors.map((error) => (
          <div key={error} className="mc-tree-bulk-panel__error">
            {error}
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            disabled={!canApply || importing}
            onClick={onApply}
          >
            {importing ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </>
  );
}
