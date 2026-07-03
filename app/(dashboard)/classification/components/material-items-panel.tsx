'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MaterialItem = {
  id: number;
  materialNodeId: number;
  fullName: string;
  pathIds?: string | null;
};

type Props = {
  pathLabel: string;
  codePreview: string;
  items: MaterialItem[];
  onCreateItem: (fullName: string) => Promise<void>;
};

export function MaterialItemsPanel({
  pathLabel,
  codePreview,
  items,
  onCreateItem,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Selected path</p>
        <p className="text-sm font-medium">{pathLabel || 'Select a category node'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Generated code</p>
        <p className="font-mono text-sm">{codePreview || '—'}</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const fullName = String(data.get('fullName') ?? '').trim();
          if (!fullName) return;
          await onCreateItem(fullName);
          form.reset();
        }}
      >
        <Input name="fullName" placeholder="Material item name" disabled={!pathLabel} />
        <Button type="submit" disabled={!pathLabel}>
          Add item
        </Button>
      </form>
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800">
          Material items
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-500">No items for this node.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>{item.fullName}</span>
                {pathLabel ? (
                  <span
                    className="shrink-0 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    title="Parent category"
                  >
                    {pathLabel.split(' / ').pop() ?? pathLabel}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
