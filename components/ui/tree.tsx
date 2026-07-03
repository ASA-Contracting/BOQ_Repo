"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  treeDepthPaddingClass,
  treeRowBase,
  treeRowHover,
  treeRowSelected,
} from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

type TreeContextValue = {
  selectedId: string | null;
  onSelect?: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
};

const TreeContext = React.createContext<TreeContextValue | null>(null);

function useTreeContext(): TreeContextValue {
  const context = React.useContext(TreeContext);
  if (!context) {
    throw new Error("Tree components must be used within Tree");
  }
  return context;
}

type TreeProps = {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  defaultExpandedIds?: string[];
  children: React.ReactNode;
  className?: string;
  role?: string;
  "aria-label"?: string;
};

export function Tree({
  selectedId = null,
  onSelect,
  defaultExpandedIds = [],
  children,
  className,
  role = "tree",
  "aria-label": ariaLabel,
}: TreeProps) {
  const [expandedIds, setExpandedIds] = React.useState(
    () => new Set(defaultExpandedIds),
  );

  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <TreeContext.Provider
      value={{ selectedId, onSelect, expandedIds, toggleExpanded }}
    >
      <div
        role={role}
        aria-label={ariaLabel}
        className={cn("flex flex-col gap-0.5 p-1", className)}
      >
        {children}
      </div>
    </TreeContext.Provider>
  );
}

type TreeItemProps = {
  id: string;
  label: React.ReactNode;
  depth?: number;
  hasChildren?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function TreeItem({
  id,
  label,
  depth = 0,
  hasChildren = false,
  icon,
  actions,
  children,
  className,
}: TreeItemProps) {
  const { selectedId, onSelect, expandedIds, toggleExpanded } =
    useTreeContext();
  const isExpanded = expandedIds.has(id);
  const isSelected = selectedId === id;

  return (
    <div role="none">
      <div className={cn("group flex items-center", treeDepthPaddingClass(depth))}>
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 shrink-0 text-muted-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            aria-expanded={isExpanded}
            onClick={() => toggleExpanded(id)}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                isExpanded && "rotate-90",
              )}
            />
          </Button>
        ) : (
          <span className="inline-block w-6 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          role="treeitem"
          aria-selected={isSelected}
          className={cn(
            treeRowBase,
            treeRowHover,
            "flex-1 justify-start text-left",
            isSelected && treeRowSelected,
            className,
          )}
          onClick={() => onSelect?.(id)}
        >
          {icon ? (
            <span className="shrink-0 text-muted-foreground">{icon}</span>
          ) : null}
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </button>

        {actions ? (
          <div className="ml-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      {hasChildren && isExpanded && children ? (
        <div role="group">{children}</div>
      ) : null}
    </div>
  );
}

export function TreeSkeleton({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1 p-2", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-7 animate-pulse rounded-md bg-muted",
            treeDepthPaddingClass(index % 3),
          )}
        />
      ))}
    </div>
  );
}
