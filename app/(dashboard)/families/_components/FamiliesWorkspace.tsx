"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  getFamilyAction,
  updateFamilyAction,
} from "@/app/(dashboard)/families/actions";
import { DeleteFamilyDialog } from "@/app/(dashboard)/families/_components/DeleteFamilyDialog";
import { FamilyDetailPanel } from "@/app/(dashboard)/families/_components/FamilyDetailPanel";
import { FamilyFormDialog } from "@/app/(dashboard)/families/_components/FamilyFormDialog";
import { FamilySearch } from "@/app/(dashboard)/families/_components/FamilySearch";
import { FamilyTree } from "@/app/(dashboard)/families/_components/FamilyTree";
import { FamilyTreeToolbar } from "@/app/(dashboard)/families/_components/FamilyTreeToolbar";
import {
  collectAllNodeIds,
  findPathToNode,
  getNodeNamesAlongPath,
  mapTreeDto,
} from "@/app/(dashboard)/families/_lib/tree-utils";
import type {
  FamilyDetailDto,
  FamilyLevelTypeDto,
  FamilyTreeNodeDto,
} from "@/application/dto/family/familyDto";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { KeyboardShortcut } from "@/components/ui/kbd";
import { useNotifications } from "@/components/ui/notifications-provider";
import { Panel, PanelBody } from "@/components/ui/panel";
import { SplitPane } from "@/components/ui/split-pane";
import {
  TableToolbar,
  TableToolbarGroup,
  TableToolbarSpacer,
} from "@/components/ui/table-toolbar";
import { Text } from "@/components/ui/typography";

type FamiliesWorkspaceProps = {
  initialTree: FamilyTreeNodeDto[];
  levelTypes: FamilyLevelTypeDto[];
  canManage: boolean;
};

export function FamiliesWorkspace({
  initialTree,
  levelTypes,
  canManage,
}: FamiliesWorkspaceProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const tree = useMemo(() => mapTreeDto(initialTree), [initialTree]);
  const levelTypeNames = useMemo(
    () =>
      Object.fromEntries(
        levelTypes.map((levelType) => [levelType.id, levelType.name]),
      ),
    [levelTypes],
  );
  const allNodeIds = useMemo(() => collectAllNodeIds(tree), [tree]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(
    tree[0]?.id ?? null,
  );
  const [selectedFamily, setSelectedFamily] = useState<FamilyDetailDto | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<number>>(
    () => new Set(allNodeIds),
  );
  const [highlightQuery, setHighlightQuery] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: "Families", href: "/families" }];

    if (!selectedId) {
      return items;
    }

    const path = findPathToNode(tree, selectedId);
    if (!path) {
      if (selectedFamily) {
        items.push({ label: selectedFamily.name });
      }
      return items;
    }

    const names = getNodeNamesAlongPath(tree, path);
    names.forEach((name) => items.push({ label: name }));
    return items;
  }, [selectedFamily, selectedId, tree]);

  const loadFamilyDetail = useCallback(async (familyId: number) => {
    setSelectedId(familyId);
    setFocusedId(familyId);
    setDetailLoading(true);
    setDetailError(null);

    const response = await getFamilyAction(familyId);
    setDetailLoading(false);

    if (!response.success) {
      setSelectedFamily(null);
      setDetailError(response.error.message);
      return;
    }

    setSelectedFamily(response.data);
  }, []);

  const revealNodeInTree = useCallback(
    (familyId: number) => {
      const path = findPathToNode(tree, familyId);
      if (!path) {
        return;
      }

      setExpandedIds((current) => {
        const next = new Set(current);
        path.forEach((id) => next.add(id));
        return next;
      });
      setFocusedId(familyId);
    },
    [tree],
  );

  const handleSelectFromSearch = useCallback(
    async (familyId: number) => {
      revealNodeInTree(familyId);
      await loadFamilyDetail(familyId);
    },
    [loadFamilyDetail, revealNodeInTree],
  );

  useEffect(() => {
    if (focusedId === null) {
      return;
    }

    const element = document.querySelector(
      `[data-tree-node-id="${focusedId}"]`,
    );
    element?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);

  function handleToggle(familyId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  }

  function handleExpandAll() {
    setExpandedIds(new Set(allNodeIds));
  }

  function handleCollapseAll() {
    setExpandedIds(new Set());
  }

  function handleMutationSuccess(family: FamilyDetailDto, message: string) {
    setSelectedId(family.id);
    setSelectedFamily(family);
    notify(message, "success");
    revealNodeInTree(family.id);
    router.refresh();
  }

  function handleDeleteSuccess() {
    setSelectedId(null);
    setSelectedFamily(null);
    setFocusedId(tree[0]?.id ?? null);
    notify("Family deleted successfully.", "success");
    router.refresh();
  }

  function openCreateDialog(parentId: number | null = selectedId) {
    setCreateParentId(parentId);
    setFormMode("create");
  }

  async function handleTreeEdit(familyId: number) {
    await loadFamilyDetail(familyId);
    setFormMode("edit");
  }

  async function handleTreeDelete(familyId: number) {
    await loadFamilyDetail(familyId);
    setDeleteOpen(true);
  }

  function handleStartRename(familyId: number, currentName: string) {
    if (!canManage) {
      return;
    }
    setRenamingId(familyId);
    setRenameDraft(currentName);
    setFocusedId(familyId);
  }

  function handleCancelRename() {
    setRenamingId(null);
    setRenameDraft("");
  }

  async function handleCommitRename(familyId: number) {
    if (!canManage) {
      return;
    }

    const trimmed = renameDraft.trim();
    setRenamingId(null);
    setRenameDraft("");

    if (trimmed.length === 0) {
      notify("Name is required.", "error");
      return;
    }

    const formData = new FormData();
    formData.set("id", String(familyId));
    formData.set("name", trimmed);

    const response = await updateFamilyAction(formData);
    if (!response.success) {
      notify(response.error.message, "error");
      return;
    }

    handleMutationSuccess(response.data, "Family renamed.");
  }

  function handleWorkspaceKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!canManage || formMode || deleteOpen || renamingId !== null) {
      return;
    }

    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      openCreateDialog(selectedId);
    }

    if (event.key.toLowerCase() === "e" && selectedFamily) {
      event.preventDefault();
      setFormMode("edit");
    }
  }

  const leftPanel = (
    <Panel padding={false} className="h-full border-0 shadow-none">
      <FamilySearch
        selectedId={selectedId}
        onQueryChange={setHighlightQuery}
        onSelectResult={handleSelectFromSearch}
      />
      <FamilyTreeToolbar
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />
      <PanelBody className="flex min-h-0 flex-1 flex-col">
        <FamilyTree
          tree={tree}
          selectedId={selectedId}
          focusedId={focusedId}
          expandedIds={expandedIds}
          levelTypeNames={levelTypeNames}
          highlightQuery={highlightQuery}
          canManage={canManage}
          renamingId={renamingId}
          renameDraft={renameDraft}
          onSelect={loadFamilyDetail}
          onToggle={handleToggle}
          onFocusNode={setFocusedId}
          onExpandNode={(familyId) =>
            setExpandedIds((current) => new Set(current).add(familyId))
          }
          onCollapseNode={(familyId) =>
            setExpandedIds((current) => {
              const next = new Set(current);
              next.delete(familyId);
              return next;
            })
          }
          onStartRename={handleStartRename}
          onRenameDraftChange={setRenameDraft}
          onCommitRename={handleCommitRename}
          onCancelRename={handleCancelRename}
          onEdit={handleTreeEdit}
          onDelete={handleTreeDelete}
          onCreateChild={(parentId) => openCreateDialog(parentId)}
        />
      </PanelBody>
    </Panel>
  );

  const rightPanel = (
    <FamilyDetailPanel
      family={selectedFamily}
      isLoading={detailLoading}
      error={detailError}
      canManage={canManage}
      onEdit={() => setFormMode("edit")}
      onDelete={() => setDeleteOpen(true)}
      onUpdated={(family) =>
        handleMutationSuccess(family, "Family updated successfully.")
      }
      onUpdateError={(message) => notify(message, "error")}
    />
  );

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col outline-none"
      tabIndex={-1}
      onKeyDown={handleWorkspaceKeyDown}
    >
      <TableToolbar className="shrink-0 px-[var(--space-inline)]">
        <div className="flex min-w-0 flex-col gap-1">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <Text weight="medium" size="sm">
              Families
            </Text>
            <Text variant="muted" size="xs">
              Hierarchical MEP family knowledge base
              {canManage ? "" : " · read-only"}
            </Text>
          </div>
        </div>

        <TableToolbarSpacer />

        {canManage ? (
          <TableToolbarGroup>
            <KeyboardShortcut keys={["N"]} className="hidden md:inline-flex" />
            <Button size="sm" onClick={() => openCreateDialog(selectedId)}>
              <Plus className="h-4 w-4" />
              New family
            </Button>
          </TableToolbarGroup>
        ) : null}
      </TableToolbar>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-[var(--space-shell)] lg:hidden">
        <Panel
          padding={false}
          className="flex min-h-[40vh] flex-1 flex-col overflow-hidden elevation-1"
        >
          {leftPanel}
        </Panel>
        <Panel
          padding={false}
          className="flex min-h-[40vh] flex-1 flex-col overflow-hidden elevation-1"
        >
          {rightPanel}
        </Panel>
      </div>

      <div className="hidden min-h-0 flex-1 p-[var(--space-shell)] pt-0 lg:flex">
        <SplitPane
          className="flex-1"
          left={leftPanel}
          right={rightPanel}
          defaultLeftPercent={35}
        />
      </div>

      {canManage && formMode === "create" ? (
        <FamilyFormDialog
          key={`create-${createParentId ?? "root"}`}
          mode="create"
          open
          tree={tree}
          levelTypes={levelTypes}
          initialFamily={null}
          defaultParentId={createParentId}
          onClose={() => {
            setFormMode(null);
            setCreateParentId(null);
          }}
          onSuccess={(family) =>
            handleMutationSuccess(family, "Family created successfully.")
          }
        />
      ) : null}

      {canManage && formMode === "edit" && selectedFamily ? (
        <FamilyFormDialog
          key={`edit-${selectedFamily.id}`}
          mode="edit"
          open
          tree={tree}
          levelTypes={levelTypes}
          initialFamily={selectedFamily}
          defaultParentId={selectedFamily.parentId}
          onClose={() => setFormMode(null)}
          onSuccess={(family) =>
            handleMutationSuccess(family, "Family updated successfully.")
          }
        />
      ) : null}

      <DeleteFamilyDialog
        open={canManage && deleteOpen}
        family={selectedFamily}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
