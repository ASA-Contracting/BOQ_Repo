'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ListFilter, Search, Tag } from 'lucide-react';

import type { CategoryPickerOption } from '@/lib/category-picker-options';
import {
  collectCategoryPickerAvailableTags,
  filterCategoryPickerOptions,
  getCategoryPickerDisplayLabel,
} from '@/lib/category-picker-options';
import { cn } from '@/lib/utils';

type PickerTriggerProps = {
  options: CategoryPickerOption[];
  value: number | null;
  disabled?: boolean;
  placeholder?: string;
  displayLabel?: string | null;
  variant?: 'default' | 'section';
  open?: boolean;
  onOpen: () => void;
};

type PickerMenuProps = {
  anchorEl: HTMLElement;
  options: CategoryPickerOption[];
  value: number | null;
  displayLabel?: string | null;
  searchPlaceholder?: string;
  onSelect: (materialNodeId: number | null) => void;
  onClose: () => void;
};

type Props = PickerTriggerProps & {
  searchPlaceholder?: string;
  onChange: (materialNodeId: number | null) => void;
};

const MENU_Z_INDEX = 200020;
const TAG_FILTER_MENU_WIDTH = 224;

function computeTagFilterMenuStyle(anchorRect: DOMRect): React.CSSProperties {
  const margin = 6;
  let left = anchorRect.right + margin;
  const top = anchorRect.top;

  if (left + TAG_FILTER_MENU_WIDTH > window.innerWidth - 8) {
    left = Math.max(8, anchorRect.left - TAG_FILTER_MENU_WIDTH - margin);
  }

  return {
    position: 'fixed',
    top,
    left,
    width: TAG_FILTER_MENU_WIDTH,
    zIndex: MENU_Z_INDEX + 1,
  };
}

function computeMenuStyle(anchorRect: DOMRect): React.CSSProperties {
  const menuWidth = Math.min(440, Math.max(anchorRect.width, 320), window.innerWidth - 16);
  let left = anchorRect.left;
  if (left + menuWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - menuWidth - 8);
  }

  return {
    position: 'fixed',
    top: anchorRect.bottom + 4,
    left,
    width: menuWidth,
    zIndex: MENU_Z_INDEX,
  };
}

function useMenuPosition(anchorEl: HTMLElement | null, open: boolean) {
  const updatePosition = useCallback(() => {
    if (!anchorEl) return computeMenuStyle(new DOMRect(0, 0, 0, 0));
    return computeMenuStyle(anchorEl.getBoundingClientRect());
  }, [anchorEl]);

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>(() => updatePosition());

  useEffect(() => {
    if (!open || !anchorEl) return;

    setMenuStyle(updatePosition());

    const onReposition = () => setMenuStyle(updatePosition());
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [anchorEl, open, updatePosition]);

  return menuStyle;
}

/** Single shared dropdown menu — mount once per grid, not once per row. */
export function BoqCategoryPickerMenu({
  anchorEl,
  options,
  value,
  displayLabel,
  searchPlaceholder = 'Search categories…',
  onSelect,
  onClose,
}: PickerMenuProps) {
  const instanceId = useId().replace(/:/g, '');
  const [query, setQuery] = useState('');
  const [selectedTagNames, setSelectedTagNames] = useState<Set<string>>(new Set());
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [tagFilterMenuStyle, setTagFilterMenuStyle] = useState<React.CSSProperties | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const tagFilterRef = useRef<HTMLDivElement>(null);
  const tagFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const tagFilterMenuRef = useRef<HTMLDivElement>(null);
  const menuStyle = useMenuPosition(anchorEl, true);

  const availableTags = useMemo(
    () => collectCategoryPickerAvailableTags(options),
    [options],
  );

  const filtered = useMemo(
    () => filterCategoryPickerOptions(options, query, selectedTagNames),
    [options, query, selectedTagNames],
  );

  const tagFilterActive = selectedTagNames.size > 0;

  const toggleTagFilter = useCallback((tagName: string) => {
    const key = tagName.trim().replace(/^#+/, '').toLowerCase();
    if (!key) return;
    setSelectedTagNames((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const clearTagFilters = useCallback(() => {
    setSelectedTagNames(new Set());
  }, []);

  const closeTagFilter = useCallback(() => {
    setTagFilterOpen(false);
  }, []);

  useLayoutEffect(() => {
    if (!tagFilterOpen || !tagFilterTriggerRef.current) {
      setTagFilterMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!tagFilterTriggerRef.current) return;
      setTagFilterMenuStyle(
        computeTagFilterMenuStyle(tagFilterTriggerRef.current.getBoundingClientRect()),
      );
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [tagFilterOpen, availableTags.length]);

  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [anchorEl, onClose]);

  useEffect(() => {
    if (!tagFilterOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (tagFilterRef.current?.contains(target)) return;
      if (tagFilterMenuRef.current?.contains(target)) return;
      setTagFilterOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [tagFilterOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const tagFilterMenu =
    tagFilterOpen && tagFilterMenuStyle ? (
      <div
        ref={tagFilterMenuRef}
        className="boq-category-picker__tag-filter-menu overflow-hidden rounded-lg border border-indigo-200 bg-white shadow-lg"
        role="menu"
        style={tagFilterMenuStyle}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-3 py-2">
          <span className="text-xs font-semibold text-indigo-900">Filter by tag</span>
          {tagFilterActive ? (
            <button
              type="button"
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
              onClick={clearTagFilters}
            >
              Clear
            </button>
          ) : null}
        </div>
        {availableTags.length === 0 ? (
          <div className="px-3 py-3 text-center text-xs text-muted-foreground">
            No tags applied yet.
          </div>
        ) : (
          <div className="max-h-48 overflow-auto py-1">
            {availableTags.map((tag) => {
              const tagKey = tag.name.toLowerCase();
              const isSelected = selectedTagNames.has(tagKey);
              return (
                <button
                  key={tag.name}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isSelected}
                  className={cn(
                    'boq-category-picker__tag-filter-option flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-indigo-100 font-semibold text-indigo-900'
                      : 'text-slate-700 hover:bg-indigo-50',
                  )}
                  onClick={() => toggleTagFilter(tag.name)}
                >
                  <Tag
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isSelected ? 'text-indigo-600' : 'text-indigo-400',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">#{tag.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{tag.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      {createPortal(
    <div
      ref={panelRef}
      id={`boq-category-picker-menu-${instanceId}`}
      className="boq-category-picker__menu overflow-visible rounded-lg border-2 border-indigo-200 bg-white shadow-xl"
      style={menuStyle}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="relative z-10 flex items-center gap-2 overflow-visible border-b border-indigo-100 bg-indigo-50 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
        <input
          ref={searchRef}
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-indigo-400"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={closeTagFilter}
          onMouseDown={closeTagFilter}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
          }}
        />
        <div ref={tagFilterRef} className="relative shrink-0">
          <button
            ref={tagFilterTriggerRef}
            type="button"
            className={cn(
              'boq-category-picker__tag-filter-trigger flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
              tagFilterActive || tagFilterOpen
                ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600',
            )}
            aria-label={
              tagFilterActive
                ? `Filter by tags (${selectedTagNames.size} selected)`
                : 'Filter by tags'
            }
            title="Filter by tags"
            aria-expanded={tagFilterOpen}
            aria-haspopup="menu"
            onClick={() => setTagFilterOpen((open) => !open)}
          >
            <ListFilter className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-auto py-1">
        <button
          type="button"
          className="flex w-full border-b border-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
          onClick={() => onSelect(null)}
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
                  isSelected ? 'bg-emerald-100 text-emerald-950' : 'hover:bg-indigo-50',
                )}
                style={{ paddingLeft: `${12 + option.depth * 14}px` }}
                onClick={() => onSelect(option.id)}
              >
                {isSelected ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block whitespace-normal break-words text-sm leading-snug',
                      isSelected ? 'font-bold' : 'font-medium text-slate-800',
                    )}
                  >
                    {getCategoryPickerDisplayLabel(option)}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body,
      )}
      {tagFilterMenu ? createPortal(tagFilterMenu, document.body) : null}
    </>
  );
}

function BoqCategoryPickerTrigger({
  options,
  value,
  disabled,
  placeholder = 'Select category…',
  displayLabel,
  variant = 'default',
  open = false,
  onOpen,
}: PickerTriggerProps) {
  const originRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value) ?? null;
  const triggerLabel =
    selected != null
      ? getCategoryPickerDisplayLabel(selected)
      : displayLabel?.trim() || null;
  const isSection = variant === 'section';

  return (
    <div
      ref={originRef}
      className={cn('boq-category-picker relative min-w-0', isSection && 'boq-category-picker--section')}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'boq-category-picker__trigger flex h-9 w-full items-center gap-1.5 rounded-md border-2 px-2.5 text-left text-xs font-semibold shadow-xs transition-colors',
          isSection
            ? triggerLabel
              ? 'boq-category-picker__trigger--section-selected'
              : 'boq-category-picker__trigger--section-empty'
            : selected
              ? 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/50'
              : 'border-amber-500 bg-amber-100 text-amber-950 ring-1 ring-amber-300/60',
          disabled && 'cursor-not-allowed opacity-60',
          open &&
            (isSection
              ? 'ring-2 ring-amber-500/35'
              : selected
                ? 'ring-2 ring-emerald-500/40'
                : 'ring-2 ring-amber-500/40'),
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onOpen}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            isSection
              ? triggerLabel
                ? 'text-[color-mix(in_oklab,rgb(var(--warning))_88%,black_12%)]'
                : 'text-[color-mix(in_oklab,rgb(var(--warning))_70%,black_20%)]'
              : selected
                ? 'text-emerald-950'
                : 'text-amber-900',
          )}
        >
          {triggerLabel ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0',
            isSection
              ? 'text-[color-mix(in_oklab,rgb(var(--warning))_75%,black_15%)]'
              : selected
                ? 'text-emerald-700'
                : 'text-amber-700',
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

/** Standalone picker for pages that edit a single row at a time. */
export function BoqCategoryPicker({
  options,
  value,
  disabled,
  placeholder = 'Select category…',
  searchPlaceholder = 'Search BOQ service categories',
  displayLabel,
  variant = 'default',
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const openMenu = useCallback(() => {
    if (disabled || !originRef.current) return;
    setAnchorEl(originRef.current);
    setOpen(true);
  }, [disabled]);

  const close = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, []);

  return (
    <div ref={originRef}>
      <BoqCategoryPickerTrigger
        options={options}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        displayLabel={displayLabel}
        variant={variant}
        open={open}
        onOpen={() => (open ? close() : openMenu())}
      />
      {open && anchorEl ? (
        <BoqCategoryPickerMenu
          anchorEl={anchorEl}
          options={options}
          value={value}
          displayLabel={displayLabel}
          searchPlaceholder={searchPlaceholder}
          onSelect={(materialNodeId) => {
            onChange(materialNodeId);
            close();
          }}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
