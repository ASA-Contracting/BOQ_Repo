'use client';

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useState } from 'react';
import type { MaterialClassificationTreeIndex } from '@/domain/classification/tree-index';
import type { LevelOptionEntity } from '@/domain/classification/entities';
import { cn } from '@/lib/utils';

type Props = {
  treeIndex: MaterialClassificationTreeIndex;
  roots: LevelOptionEntity[];
  selectedNodeId: number | null;
  onSelect: (nodeId: number) => void;
  onAddChild: (parentId: number, name: string) => Promise<void>;
  onRename: (nodeId: number, name: string) => Promise<void>;
  onDelete: (nodeId: number) => Promise<void>;
};

function TreeNode({
  node,
  treeIndex,
  selectedNodeId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  depth,
}: {
  node: LevelOptionEntity;
  treeIndex: MaterialClassificationTreeIndex;
  selectedNodeId: number | null;
  onSelect: (nodeId: number) => void;
  onAddChild: (parentId: number, name: string) => Promise<void>;
  onRename: (nodeId: number, name: string) => Promise<void>;
  onDelete: (nodeId: number) => Promise<void>;
  depth: number;
}) {
  const children = treeIndex.childrenByParentId.get(node.id) ?? [];
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800',
          isSelected && 'bg-zinc-100 dark:bg-zinc-800'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center"
          onClick={() => setExpanded((value) => !value)}
        >
          {children.length > 0 ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="inline-block h-4 w-4" />
          )}
        </button>
        <button type="button" className="flex-1 truncate text-left" onClick={() => onSelect(node.id)}>
          {node.name}
        </button>
        <div className="hidden gap-1 group-hover:flex">
          <button
            type="button"
            className="rounded px-1 text-xs text-zinc-500 hover:text-zinc-900"
            onClick={async () => {
              const name = window.prompt('Child category name');
              if (name) await onAddChild(node.id, name);
            }}
          >
            +
          </button>
          <button
            type="button"
            className="rounded px-1 text-xs text-zinc-500 hover:text-zinc-900"
            onClick={async () => {
              const name = window.prompt('Rename category', node.name);
              if (name) await onRename(node.id, name);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded px-1 text-xs text-red-500 hover:text-red-700"
            onClick={async () => {
              if (window.confirm(`Delete "${node.name}"?`)) await onDelete(node.id);
            }}
          >
            Del
          </button>
        </div>
      </div>
      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            treeIndex={treeIndex}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export function CategoryTree({
  treeIndex,
  roots,
  selectedNodeId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
}: Props) {
  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-600">
        <FolderTree className="h-4 w-4" />
        Categories
      </div>
      {roots.length === 0 ? (
        <p className="px-2 text-sm text-zinc-500">No categories yet.</p>
      ) : (
        roots.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            treeIndex={treeIndex}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
            depth={0}
          />
        ))
      )}
    </div>
  );
}
