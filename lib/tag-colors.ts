import type { CSSProperties } from 'react';

export type TagRecord = {
  id: number;
  name: string;
  color?: string | null;
};

export const TAG_COLOR_OPTIONS = [
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#0ea5e9',
] as const;

export function defaultTagColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return TAG_COLOR_OPTIONS[Math.abs(hash) % TAG_COLOR_OPTIONS.length];
}

export function resolveTagColor(tag: Pick<TagRecord, 'name' | 'color'>): string {
  return tag.color ?? defaultTagColor(tag.name);
}

export function tagColorStyle(tag: Pick<TagRecord, 'name' | 'color'>): CSSProperties {
  const color = resolveTagColor(tag);
  return {
    background: color,
    borderColor: color,
    color: '#fff',
  };
}

export function clampPopoverPosition(
  anchor: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  gap = 6,
): { top: number; left: number } {
  const margin = 12;
  let top = anchor.bottom + gap;
  let left = anchor.left;

  if (top + popoverHeight > window.innerHeight - margin) {
    top = anchor.top - popoverHeight - gap;
  }
  if (left + popoverWidth > window.innerWidth - margin) {
    left = window.innerWidth - popoverWidth - margin;
  }
  if (left < margin) left = margin;
  if (top < margin) top = margin;
  if (top + popoverHeight > window.innerHeight - margin) {
    top = Math.max(margin, window.innerHeight - popoverHeight - margin);
  }

  return { top, left };
}
