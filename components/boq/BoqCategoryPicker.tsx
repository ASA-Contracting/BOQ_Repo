'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import type { CategoryPickerOption } from '@/lib/category-picker-options';
import { filterCategoryPickerOptions } from '@/lib/category-picker-options';
import { cn } from '@/lib/utils';

type Props = {
  options: CategoryPickerOption[];
  value: number | null;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (materialNodeId: number | null) => void;
};

export function BoqCategoryPicker({
  options,
  value,
  disabled,
  placeholder = 'Select category…',
  searchPlaceholder = 'Search BOQ service categories',
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.id === value) ?? null;
  const filtered = useMemo(
    () => filterCategoryPickerOptions(options, query),
    [options, query],
  );

  return (
    <div className="boq-category-picker relative min-w-[200px]">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'boq-category-picker__trigger flex h-9 w-full items-center gap-1.5 rounded-md border-2 px-2.5 text-left text-xs font-semibold shadow-xs transition-colors',
          selected
            ? 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/50'
            : 'border-amber-500 bg-amber-100 text-amber-950 ring-1 ring-amber-300/60',
          disabled && 'cursor-not-allowed opacity-60',
          open && (selected ? 'ring-2 ring-emerald-500/40' : 'ring-2 ring-amber-500/40'),
        )}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            selected ? 'text-emerald-950' : 'text-amber-900',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0',
            selected ? 'text-emerald-700' : 'text-amber-700',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close category picker"
            onClick={() => setOpen(false)}
          />
          <div className="boq-category-picker__menu absolute left-0 top-[calc(100%+4px)] z-50 w-[min(360px,75vw)] overflow-hidden rounded-lg border-2 border-indigo-200 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2">
              <Search className="h-4 w-4 text-indigo-600" aria-hidden />
              <input
                autoFocus
                className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-indigo-400"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-auto py-1">
              <button
                type="button"
                className="flex w-full border-b border-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery('');
                }}
              >
                Clear category
              </button>
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No matching categories — try Category builder
                </div>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-emerald-100 text-emerald-950'
                          : 'hover:bg-indigo-50',
                      )}
                      style={{ paddingLeft: `${12 + option.depth * 14}px` }}
                      onClick={() => {
                        onChange(option.id);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      {isSelected ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-sm',
                            isSelected ? 'font-bold' : 'font-medium text-slate-800',
                          )}
                        >
                          {option.label}
                        </span>
                        {option.path !== option.label && (
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {option.path}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
