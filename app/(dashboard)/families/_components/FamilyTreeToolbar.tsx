"use client";

import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TableToolbar,
  TableToolbarGroup,
  TableToolbarTitle,
} from "@/components/ui/table-toolbar";

type FamilyTreeToolbarProps = {
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function FamilyTreeToolbar({
  onExpandAll,
  onCollapseAll,
}: FamilyTreeToolbarProps) {
  return (
    <TableToolbar className="h-auto min-h-[var(--toolbar-height)] px-[var(--space-inline)] py-1.5">
      <TableToolbarTitle>Hierarchy</TableToolbarTitle>
      <TableToolbarGroup>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExpandAll}
          aria-label="Expand all nodes"
        >
          <ChevronsUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Expand all</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCollapseAll}
          aria-label="Collapse all nodes"
        >
          <ChevronsDownUp className="h-4 w-4" />
          <span className="hidden sm:inline">Collapse all</span>
        </Button>
      </TableToolbarGroup>
    </TableToolbar>
  );
}
