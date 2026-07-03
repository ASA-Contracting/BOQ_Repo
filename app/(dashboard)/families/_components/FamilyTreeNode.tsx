"use client";

import {
  Folder,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { memo } from "react";

import type { FamilyTreeNodeData } from "@/app/(dashboard)/families/_lib/tree-utils";
import { splitHighlightText } from "@/app/(dashboard)/families/_lib/tree-utils";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  searchMatchHighlight,
  treeDepthPaddingClass,
  treeRowBase,
  treeRowHover,
  treeRowSelected,
} from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

type FamilyTreeNodeProps = {
  node: FamilyTreeNodeData;
  level: number;
  selectedId: number | null;
  focusedId: number | null;
  expandedIds: ReadonlySet<number>;
  levelTypeNames: Readonly<Record<number, string>>;
  highlightQuery: string;
  canManage: boolean;
  renamingId: number | null;
  renameDraft: string;
  onSelect: (familyId: number) => void;
  onToggle: (familyId: number) => void;
  onFocusNode: (familyId: number) => void;
  onStartRename: (familyId: number, currentName: string) => void;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: (familyId: number) => void;
  onCancelRename: () => void;
  onEdit: (familyId: number) => void;
  onDelete: (familyId: number) => void;
  onCreateChild: (parentId: number) => void;
};

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const segments = splitHighlightText(text, query);

  return (
    <>
      {segments.map((segment, index) => (
        <span
          key={`${segment.text}-${index}`}
          className={cn(segment.match && searchMatchHighlight)}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

function RenameInput({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <Input
      autoFocus
      value={value}
      inputSize="sm"
      className="h-7 min-w-0 flex-1 text-sm"
      aria-label="Rename family"
      maxLength={100}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      onBlur={onCommit}
    />
  );
}

export const FamilyTreeNode = memo(function FamilyTreeNode({
  node,
  level,
  selectedId,
  focusedId,
  expandedIds,
  levelTypeNames,
  highlightQuery,
  canManage,
  renamingId,
  renameDraft,
  onSelect,
  onToggle,
  onFocusNode,
  onStartRename,
  onRenameDraftChange,
  onCommitRename,
  onCancelRename,
  onEdit,
  onDelete,
  onCreateChild,
}: FamilyTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isFocused = focusedId === node.id;
  const isRenaming = renamingId === node.id;
  const levelTypeName = levelTypeNames[node.familyLevelTypeId] ?? "Unknown";
  const NodeIcon = hasChildren ? (isExpanded ? FolderOpen : Folder) : Tag;

  const row = (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-md border border-transparent pr-1",
        treeDepthPaddingClass(level),
        isSelected && "border-border bg-accent text-accent-foreground",
        !isSelected && "hover:bg-muted/50",
        isFocused && !isSelected && "ring-1 ring-ring/40",
      )}
    >
      <span
        className="inline-flex h-7 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70"
        aria-hidden="true"
        title="Drag and drop planned"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      <IconButton
        label={hasChildren ? (isExpanded ? "Collapse node" : "Expand node") : "Leaf node"}
        icon={
          hasChildren ? (
            <NodeIcon className="h-4 w-4" />
          ) : (
            <Tag className="h-3.5 w-3.5" />
          )
        }
        size="sm"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground"
        disabled={!hasChildren}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          }
          onFocusNode(node.id);
        }}
      />

      <button
        type="button"
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        className={cn(
          treeRowBase,
          treeRowHover,
          "min-w-0 flex-1 border-0 bg-transparent py-1.5 shadow-none ring-0 focus-visible:ring-0",
          isSelected && treeRowSelected,
        )}
        onClick={() => {
          onFocusNode(node.id);
          onSelect(node.id);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          if (canManage) {
            onStartRename(node.id, node.name);
          }
        }}
      >
        {isRenaming ? (
          <RenameInput
            value={renameDraft}
            onChange={onRenameDraftChange}
            onCommit={() => onCommitRename(node.id)}
            onCancel={onCancelRename}
          />
        ) : (
          <>
            <span className="truncate font-medium">
              <HighlightedText text={node.name} query={highlightQuery} />
            </span>
            <Badge variant="outline" className="hidden shrink-0 font-normal sm:inline-flex">
              {levelTypeName}
            </Badge>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div data-tree-node-id={node.id} role="none">
      {canManage ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => onSelect(node.id)}>
              Open
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => onStartRename(node.id, node.name)}
            >
              Rename
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onEdit(node.id)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit…
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onCreateChild(node.id)}>
              <Plus className="h-3.5 w-3.5" />
              New child family
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
              onSelect={() => onDelete(node.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        row
      )}

      {hasChildren ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70",
          )}
          role="group"
        >
          <div className="overflow-hidden">
            {node.children.map((child) => (
              <FamilyTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                focusedId={focusedId}
                expandedIds={expandedIds}
                levelTypeNames={levelTypeNames}
                highlightQuery={highlightQuery}
                canManage={canManage}
                renamingId={renamingId}
                renameDraft={renameDraft}
                onSelect={onSelect}
                onToggle={onToggle}
                onFocusNode={onFocusNode}
                onStartRename={onStartRename}
                onRenameDraftChange={onRenameDraftChange}
                onCommitRename={onCommitRename}
                onCancelRename={onCancelRename}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateChild={onCreateChild}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});
