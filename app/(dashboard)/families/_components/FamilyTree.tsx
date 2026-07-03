"use client";

import { FolderTree } from "lucide-react";
import { memo, useCallback, useMemo, type KeyboardEvent } from "react";

import type { FamilyTreeNodeData } from "@/app/(dashboard)/families/_lib/tree-utils";
import { flattenVisibleNodes } from "@/app/(dashboard)/families/_lib/tree-utils";
import { FamilyTreeNode } from "@/app/(dashboard)/families/_components/FamilyTreeNode";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

type FamilyTreeProps = {
  tree: FamilyTreeNodeData[];
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
  onExpandNode: (familyId: number) => void;
  onCollapseNode: (familyId: number) => void;
  onStartRename: (familyId: number, currentName: string) => void;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: (familyId: number) => void;
  onCancelRename: () => void;
  onEdit: (familyId: number) => void;
  onDelete: (familyId: number) => void;
  onCreateChild: (parentId: number) => void;
};

export const FamilyTree = memo(function FamilyTree({
  tree,
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
  onExpandNode,
  onCollapseNode,
  onStartRename,
  onRenameDraftChange,
  onCommitRename,
  onCancelRename,
  onEdit,
  onDelete,
  onCreateChild,
}: FamilyTreeProps) {
  const visibleNodes = useMemo(
    () => flattenVisibleNodes(tree, expandedIds),
    [expandedIds, tree],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (visibleNodes.length === 0 || renamingId !== null) {
        return;
      }

      const currentIndex = Math.max(
        0,
        visibleNodes.findIndex((node) => node.id === focusedId),
      );
      const currentNode = visibleNodes[currentIndex];

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const nextNode = visibleNodes[currentIndex + 1] ?? currentNode;
          onFocusNode(nextNode.id);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const previousNode = visibleNodes[currentIndex - 1] ?? currentNode;
          onFocusNode(previousNode.id);
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (
            currentNode.children.length > 0 &&
            !expandedIds.has(currentNode.id)
          ) {
            onExpandNode(currentNode.id);
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (
            currentNode.children.length > 0 &&
            expandedIds.has(currentNode.id)
          ) {
            onCollapseNode(currentNode.id);
            return;
          }

          if (currentNode.parentId !== null) {
            onFocusNode(currentNode.parentId);
          }
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          onSelect(currentNode.id);
          break;
        }
        case "Home": {
          event.preventDefault();
          onFocusNode(visibleNodes[0].id);
          break;
        }
        case "End": {
          event.preventDefault();
          onFocusNode(visibleNodes[visibleNodes.length - 1].id);
          break;
        }
        case "F2": {
          if (canManage) {
            event.preventDefault();
            onStartRename(currentNode.id, currentNode.name);
          }
          break;
        }
        default:
          break;
      }
    },
    [
      canManage,
      expandedIds,
      focusedId,
      onCollapseNode,
      onExpandNode,
      onFocusNode,
      onSelect,
      onStartRename,
      renamingId,
      visibleNodes,
    ],
  );

  if (tree.length === 0) {
    return (
      <EmptyState
        compact
        icon={FolderTree}
        title="No families yet"
        description="Create the first family to start building the hierarchy."
      />
    );
  }

  return (
    <ScrollArea
      className="min-h-0 flex-1 px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      tabIndex={0}
      role="tree"
      aria-label="Family hierarchy"
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-0.5">
        {tree.map((node) => (
          <FamilyTreeNode
            key={node.id}
            node={node}
            level={0}
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
    </ScrollArea>
  );
});
