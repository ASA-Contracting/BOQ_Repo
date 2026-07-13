'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconTrash, IconX } from '@/components/explorer-tree/classification-icons';
import { useClassificationOverlayPortalElement } from './classification-overlay-portal';
import {
  TAG_COLOR_OPTIONS,
  clampPopoverPosition,
  defaultTagColor,
  resolveTagColor,
  tagColorStyle,
  type TagRecord,
} from '@/lib/tag-colors';

function TagColorPicker({
  value,
  onChange,
  ariaLabel = 'Choose tag color',
}: {
  value: string;
  onChange: (color: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="mc-tree-tag-colors" role="listbox" aria-label={ariaLabel}>
      {TAG_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          role="option"
          aria-selected={value === color}
          className={`mc-tree-tag-colors__swatch ${value === color ? 'is-selected' : ''}`}
          style={{ background: color }}
          title={color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

function useFixedPopoverPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  deps: unknown[] = [],
) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !popoverRef.current) {
      setPosition(null);
      return;
    }

    const anchor = anchorRef.current.getBoundingClientRect();
    const popover = popoverRef.current;
    const next = clampPopoverPosition(anchor, popover.offsetWidth, popover.offsetHeight);
    setPosition(next);
  }, [open, anchorRef, ...deps]);

  return { popoverRef, position };
}

function useTagOverlayPortal(): HTMLElement | null {
  const portalElement = useClassificationOverlayPortalElement();
  if (portalElement) return portalElement;
  return typeof document !== 'undefined' ? document.body : null;
}

export function CategoryTagEditPopover({
  anchorRef,
  tag,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  tag: TagRecord;
  onChange: (next: TagRecord) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { popoverRef, position } = useFixedPopoverPosition(anchorRef, true, [tag.id, tag.name, tag.color]);

  useEffect(() => {
    queueMicrotask(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [tag.id]);

  const portalElement = useTagOverlayPortal();
  if (!portalElement) return null;

  return createPortal(
    <>
      <div className="mc-tree-tag-overlay" onMouseDown={onClose} />
      <div
        ref={popoverRef}
        className="mc-tree-tag-edit-popover"
        role="dialog"
        aria-label={`Edit tag ${tag.name}`}
        style={
          position
            ? { top: `${position.top}px`, left: `${position.left}px` }
            : { visibility: 'hidden' as const }
        }
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <form
          className="mc-tree-tag-edit-popover__form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={tag.name}
            aria-label="Tag name"
            autoComplete="off"
            onChange={(event) => onChange({ ...tag, name: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
          />
          <button type="submit" className="mc-tree-tag-edit-popover__save" disabled={!tag.name.trim()}>
            Save
          </button>
        </form>
        <TagColorPicker
          value={resolveTagColor(tag)}
          onChange={(color) => onChange({ ...tag, color })}
          ariaLabel="Choose tag color"
        />
        <button type="button" className="mc-tree-tag-edit-popover__delete" onClick={onDelete}>
          <i aria-hidden="true">
            <IconTrash />
          </i>
          <span>Delete tag</span>
        </button>
      </div>
    </>,
    portalElement,
  );
}

export function CategoryTagPickerPopover({
  anchorRef,
  open,
  tags,
  assignedTagIds,
  query,
  onQueryChange,
  onToggleTag,
  onCreateTag,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  tags: TagRecord[];
  assignedTagIds: Set<number>;
  query: string;
  onQueryChange: (value: string) => void;
  onToggleTag: (tagId: number) => void;
  onCreateTag: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [createColor, setCreateColor] = useState(defaultTagColor(''));
  const { popoverRef, position } = useFixedPopoverPosition(anchorRef, open, [
    tags.length,
    query,
    assignedTagIds.size,
  ]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim().replace(/^#+/, '');
    if (trimmed) setCreateColor(defaultTagColor(trimmed));
  }, [query]);

  const portalElement = useTagOverlayPortal();
  if (!open || !portalElement) return null;

  const normalizedQuery = query.trim().replace(/^#+/, '');
  const normalizedQueryLower = normalizedQuery.toLowerCase();
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(normalizedQueryLower),
  );
  const exactMatch = tags.some((tag) => tag.name.toLowerCase() === normalizedQueryLower);
  const canCreate = normalizedQuery.length > 0 && !exactMatch;

  return createPortal(
    <>
      <div className="mc-tree-tag-overlay" onMouseDown={onClose} />
      <div
        ref={popoverRef}
        className="mc-tree-tag-picker"
        role="dialog"
        aria-label="Select or create tags"
        style={
          position
            ? { top: `${position.top}px`, left: `${position.left}px` }
            : { visibility: 'hidden' as const }
        }
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mc-tree-tag-picker__search">
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Select or create a tag"
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
              if (event.key === 'Enter' && canCreate) {
                event.preventDefault();
                onCreateTag(normalizedQuery, createColor);
                onQueryChange('');
              }
            }}
          />
        </div>

        {canCreate ? (
          <div className="mc-tree-tag-picker__create">
            <div className="mc-tree-tag-picker__create-head">
              <span>Create</span>
              <button
                type="button"
                className="mc-tree-tag-picker__create-pill"
                style={tagColorStyle({ name: normalizedQuery, color: createColor })}
                onClick={() => {
                  onCreateTag(normalizedQuery, createColor);
                  onQueryChange('');
                }}
              >
                {normalizedQuery}
              </button>
            </div>
            <TagColorPicker value={createColor} onChange={setCreateColor} ariaLabel="Choose color for new tag" />
          </div>
        ) : null}

        <div className="mc-tree-tag-picker__list mc-tree-tag-picker__list--assign" role="listbox" aria-label="Existing tags">
          {filteredTags.length === 0 ? (
            <div className="mc-tree-tag-picker__empty">No matching tags.</div>
          ) : (
            filteredTags.map((tag) => {
              const isAssigned = assignedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
                  aria-selected={isAssigned}
                  className={`mc-tree-tag-picker__option ${isAssigned ? 'is-assigned' : ''}`}
                  onClick={() => onToggleTag(tag.id)}
                >
                  <span className="mc-tree-tag-picker__pill" style={tagColorStyle(tag)}>
                    {tag.name}
                  </span>
                  {isAssigned ? <span className="mc-tree-tag-picker__check">Applied</span> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>,
    portalElement,
  );
}

export function CategoryAssignedTagPill({
  tag,
  onRemove,
}: {
  tag: TagRecord;
  onRemove: () => void;
}) {
  return (
    <span className="mc-tree-context-tag-pill" style={tagColorStyle(tag)}>
      <span className="mc-tree-context-tag-pill__label">{tag.name}</span>
      <button
        type="button"
        className="mc-tree-context-tag-pill__action mc-tree-context-tag-pill__action--remove"
        title="Remove from this category"
        aria-label={`Remove tag ${tag.name} from this category`}
        onClick={onRemove}
      >
        <i aria-hidden="true">
          <IconX />
        </i>
      </button>
    </span>
  );
}
