'use client';

import { IconDownload, IconNodePlus, IconUpload } from '@/components/explorer-tree/classification-icons';

type Props = {
  exporting: boolean;
  categoryCount: number;
  onBulkAdd: () => void;
  onImport: () => void;
  onExport: () => void;
};

export function CategoryTreeHeader({ exporting, categoryCount, onBulkAdd, onImport, onExport }: Props) {
  return (
    <div className="mc-tree-header">
      <div className="mc-tree-header__copy">
        <h2>Categories</h2>
      </div>
      <div className="mc-tree-header__actions">
        <button type="button" className="mc-tree-header__action" title="Paste categories from Excel" onClick={onBulkAdd}>
          <i aria-hidden="true">
            <IconNodePlus />
          </i>
          <span>Bulk add</span>
        </button>
        <button type="button" className="mc-tree-header__action" title="Import categories from Excel or CSV" onClick={onImport}>
          <i aria-hidden="true">
            <IconUpload />
          </i>
          <span>Import</span>
        </button>
        <button
          type="button"
          className="mc-tree-header__action"
          title="Export the full category tree"
          disabled={exporting || categoryCount === 0}
          onClick={onExport}
        >
          <i aria-hidden="true">
            <IconDownload />
          </i>
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
