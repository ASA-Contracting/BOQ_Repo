"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveBoqVersionAction,
  bulkApproveSimilarAction,
  getBatchContextAction,
  getNextItemAction,
  getPreviousItemAction,
  getWorkshopItemAction,
  publishBatchAction,
  returnToEngineerAction,
  runBatchAiAction,
  saveClassificationAction,
  skipItemAction,
  submitEngineerReviewAction,
} from "@/app/(dashboard)/workshop/categorize/[batchId]/actions";
import { FamilySearch } from "@/app/(dashboard)/families/_components/FamilySearch";
import { FamilyTree } from "@/app/(dashboard)/families/_components/FamilyTree";
import {
  collectAllNodeIds,
  findPathToNode,
  getNodeNamesAlongPath,
  mapTreeDto,
} from "@/app/(dashboard)/families/_lib/tree-utils";
import type {
  CategorizationBatchContextDto,
  WorkshopItemReviewDto,
} from "@/application/dto/workshop/categorizationDto";
import type {
  FamilyLevelTypeDto,
  FamilyTreeNodeDto,
} from "@/application/dto/family/familyDto";
import {
  AiSuggestionList,
  PriorDecisionsList,
  SimilarItemsList,
} from "@/components/workshop";
import { Button } from "@/components/ui/button";
import { KeyboardShortcut } from "@/components/ui/kbd";
import { useNotifications } from "@/components/ui/notifications-provider";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { PropertyGrid } from "@/components/ui/property-grid";
import { SplitPane } from "@/components/ui/split-pane";
import {
  TableToolbar,
  TableToolbarGroup,
  TableToolbarSpacer,
} from "@/components/ui/table-toolbar";
import { Text } from "@/components/ui/typography";
import {
  useCategorizationShortcuts,
  useCategorizationUndo,
} from "@/app/(dashboard)/workshop/categorize/[batchId]/_hooks/useCategorizationShortcuts";

type CategorizationWorkspaceProps = {
  batchId: number;
  initialContext: CategorizationBatchContextDto;
  initialItem: WorkshopItemReviewDto | null;
  initialTree: FamilyTreeNodeDto[];
  levelTypes: FamilyLevelTypeDto[];
};

export function CategorizationWorkspace({
  batchId,
  initialContext,
  initialItem,
  initialTree,
  levelTypes,
}: CategorizationWorkspaceProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const tree = useMemo(() => mapTreeDto(initialTree), [initialTree]);
  const allNodeIds = useMemo(() => collectAllNodeIds(tree), [tree]);
  const levelTypeNames = useMemo(
    () => Object.fromEntries(levelTypes.map((type) => [type.id, type.name])),
    [levelTypes],
  );

  const [context, setContext] = useState(initialContext);
  const [currentItem, setCurrentItem] = useState(initialItem);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(
    initialItem?.finalFamilyId ??
      initialItem?.aiSuggestions[0]?.familyId ??
      null,
  );
  const [selectedId, setSelectedId] = useState<number | null>(selectedFamilyId);
  const [focusedId, setFocusedId] = useState<number | null>(
    selectedFamilyId ?? tree[0]?.id ?? null,
  );
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<number>>(
    () => new Set(allNodeIds),
  );
  const [highlightQuery, setHighlightQuery] = useState("");
  const [runningAi, setRunningAi] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [approvingVersion, setApprovingVersion] = useState(false);
  const [returningToEngineer, setReturningToEngineer] = useState(false);
  const [saving, setSaving] = useState(false);
  const { pushChange, undo, redo, canUndo, canRedo } = useCategorizationUndo();

  const loadItem = useCallback(
    async (itemId: number) => {
      const result = await getWorkshopItemAction(batchId, itemId);
      if (!result.success) {
        notify(`Load failed: ${result.error.message}`, "error");
        return;
      }

      setCurrentItem(result.data);
      const nextFamilyId =
        result.data.finalFamilyId ?? result.data.aiSuggestions[0]?.familyId ?? null;
      setSelectedFamilyId(nextFamilyId);
      setSelectedId(nextFamilyId);
      if (nextFamilyId) {
        setFocusedId(nextFamilyId);
        const path = findPathToNode(tree, nextFamilyId);
        if (path) {
          setExpandedIds((current) => new Set([...current, ...path]));
        }
      }
    },
    [batchId, notify, tree],
  );

  const navigateNext = useCallback(async () => {
    const result = await getNextItemAction(batchId, currentItem?.id);
    if (!result.success) {
      notify(`Queue complete: ${result.error.message}`, "info");
      return;
    }
    if (result.data.itemId) {
      await loadItem(result.data.itemId);
    }
  }, [batchId, currentItem?.id, loadItem, notify]);

  const navigatePrevious = useCallback(async () => {
    if (!currentItem) {
      return;
    }
    const result = await getPreviousItemAction(batchId, currentItem.id);
    if (!result.success) {
      notify(`No previous item: ${result.error.message}`, "info");
      return;
    }
    if (result.data.itemId) {
      await loadItem(result.data.itemId);
    }
  }, [batchId, currentItem, loadItem, notify]);

  const handleSave = useCallback(async () => {
    if (!currentItem || !selectedFamilyId) {
      notify("Choose a category before saving.", "warning");
      return false;
    }

    setSaving(true);
    try {
      const previousFamilyId = currentItem.finalFamilyId;
      const result = await saveClassificationAction({
        batchId,
        itemId: currentItem.id,
        familyId: selectedFamilyId,
      });

      if (!result.success) {
        notify(`Save failed: ${result.error.message}`, "error");
        return false;
      }

      pushChange({
        itemId: currentItem.id,
        previousFamilyId,
        newFamilyId: selectedFamilyId,
      });

      setContext((current) => ({
        ...current,
        reviewedCount: current.reviewedCount + 1,
        batch: {
          ...current.batch,
          itemsApprovedCount: current.batch.itemsApprovedCount + 1,
          itemsPendingReviewCount: Math.max(0, current.batch.itemsPendingReviewCount - 1),
        },
      }));

      notify("Classification approved in Workshop.", "success");
      return true;
    } finally {
      setSaving(false);
    }
  }, [batchId, currentItem, notify, pushChange, selectedFamilyId]);

  const handleSaveAndNext = useCallback(async () => {
    const saved = await handleSave();
    if (saved) {
      await navigateNext();
    }
  }, [handleSave, navigateNext]);

  const handleSkip = useCallback(async () => {
    if (!currentItem) {
      return;
    }

    const result = await skipItemAction({ batchId, itemId: currentItem.id });
    if (!result.success) {
      notify(`Skip failed: ${result.error.message}`, "error");
      return;
    }

    await navigateNext();
  }, [batchId, currentItem, navigateNext, notify]);

  const handleRunAi = useCallback(async () => {
    setRunningAi(true);
    try {
      const result = await runBatchAiAction({ batchId });
      if (!result.success) {
        notify(`AI run failed: ${result.error.message}`, "error");
        return;
      }

      setContext((current) => ({
        ...current,
        hasAiRun: true,
        batch: {
          ...current.batch,
          status: "ready_for_review",
          workflowStage: "ready_for_engineer_review",
          latestAiAnalysisId: 1,
        },
      }));

      if (currentItem) {
        await loadItem(currentItem.id);
      }

      notify(`${result.data.suggestionCount} AI suggestions generated.`, "success");
    } finally {
      setRunningAi(false);
    }
  }, [batchId, currentItem, loadItem, notify]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const result = await publishBatchAction({ batchId, publishPolicy: "partial" });
      if (!result.success) {
        notify(`Publish failed: ${result.error.message}`, "error");
        return;
      }

      notify(
        `Published ${result.data.publishedCount} item(s) to production.`,
        "success",
      );
    } finally {
      setPublishing(false);
    }
  }, [batchId, notify]);

  const refreshContext = useCallback(async () => {
    const result = await getBatchContextAction(batchId);
    if (result.success) {
      setContext(result.data);
    }
  }, [batchId]);

  const handleSubmitEngineerReview = useCallback(async () => {
    setSubmittingReview(true);
    try {
      const result = await submitEngineerReviewAction({ batchId });
      if (!result.success) {
        notify(`Submit failed: ${result.error.message}`, "error");
        return;
      }
      await refreshContext();
      notify("Submitted for section-head review.", "success");
    } finally {
      setSubmittingReview(false);
    }
  }, [batchId, notify, refreshContext]);

  const handleApproveVersion = useCallback(async () => {
    setApprovingVersion(true);
    try {
      const result = await approveBoqVersionAction({ batchId });
      if (!result.success) {
        notify(`Approval failed: ${result.error.message}`, "error");
        return;
      }
      await refreshContext();
      notify(`Approved as ${result.data.versionName}.`, "success");
    } finally {
      setApprovingVersion(false);
    }
  }, [batchId, notify, refreshContext]);

  const handleReturnToEngineer = useCallback(async () => {
    setReturningToEngineer(true);
    try {
      const result = await returnToEngineerAction({ batchId });
      if (!result.success) {
        notify(`Return failed: ${result.error.message}`, "error");
        return;
      }
      await refreshContext();
      notify("Returned to engineer for revision.", "success");
    } finally {
      setReturningToEngineer(false);
    }
  }, [batchId, notify, refreshContext]);

  const handleBulkApproveSimilar = useCallback(async () => {
    if (!currentItem || !selectedFamilyId) {
      notify("Choose a category before applying to similar items.", "warning");
      return;
    }

    const pendingSimilar = (currentItem.similarItems ?? []).filter(
      (item) => item.finalFamilyId === null,
    );
    if (pendingSimilar.length === 0) {
      notify("No pending similar items to approve.", "info");
      return;
    }

    const result = await bulkApproveSimilarAction({
      batchId,
      sourceItemId: currentItem.id,
      familyId: selectedFamilyId,
      similarItemIds: pendingSimilar.map((item) => item.id),
    });

    if (!result.success) {
      notify(`Bulk approve failed: ${result.error.message}`, "error");
      return;
    }

    notify(`Approved ${result.data.approvedCount} similar item(s) in Workshop.`, "success");
    await loadItem(currentItem.id);
  }, [batchId, currentItem, loadItem, notify, selectedFamilyId]);

  const acceptSuggestion = useCallback(
    (index: number) => {
      const suggestion = currentItem?.aiSuggestions[index];
      if (!suggestion?.familyId) {
        return;
      }
      setSelectedFamilyId(suggestion.familyId);
      setSelectedId(suggestion.familyId);
      setFocusedId(suggestion.familyId);
    },
    [currentItem?.aiSuggestions],
  );

  useCategorizationShortcuts({
    enabled: Boolean(currentItem),
    onPrevious: () => void navigatePrevious(),
    onNext: () => void navigateNext(),
    onSave: () => void handleSave(),
    onSaveAndNext: () => void handleSaveAndNext(),
    onSkip: () => void handleSkip(),
    onUndo: () => {
      const entry = undo();
      if (entry && currentItem?.id === entry.itemId) {
        setSelectedFamilyId(entry.previousFamilyId);
        setSelectedId(entry.previousFamilyId);
      }
    },
    onRedo: () => {
      const entry = redo();
      if (entry && currentItem?.id === entry.itemId) {
        setSelectedFamilyId(entry.newFamilyId);
        setSelectedId(entry.newFamilyId);
      }
    },
    onAcceptSuggestion: acceptSuggestion,
  });

  useEffect(() => {
    if (selectedId) {
      const path = findPathToNode(tree, selectedId);
      if (path) {
        setExpandedIds((current) => new Set([...current, ...path]));
      }
    }
  }, [selectedId, tree]);

  const selectedFamilyPath = useMemo(() => {
    if (!selectedFamilyId) {
      return "(none)";
    }
    const path = findPathToNode(tree, selectedFamilyId);
    if (!path) {
      return String(selectedFamilyId);
    }
    return getNodeNamesAlongPath(tree, path).join(" > ");
  }, [selectedFamilyId, tree]);

  const familyPicker = (
    <Panel className="h-full rounded-none border-0 shadow-none">
      <PanelHeader title="Families" />
      <PanelBody className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <FamilySearch
          selectedId={selectedId}
          onQueryChange={setHighlightQuery}
          onSelectResult={(familyId) => {
            setSelectedFamilyId(familyId);
            setSelectedId(familyId);
            setFocusedId(familyId);
          }}
        />
        <FamilyTree
          tree={tree}
          selectedId={selectedId}
          focusedId={focusedId}
          expandedIds={expandedIds}
          levelTypeNames={levelTypeNames}
          highlightQuery={highlightQuery}
          canManage={false}
          renamingId={null}
          renameDraft=""
          onSelect={(familyId) => {
            setSelectedFamilyId(familyId);
            setSelectedId(familyId);
          }}
          onToggle={(familyId) => {
            setExpandedIds((current) => {
              const next = new Set(current);
              if (next.has(familyId)) {
                next.delete(familyId);
              } else {
                next.add(familyId);
              }
              return next;
            });
          }}
          onFocusNode={setFocusedId}
          onExpandNode={(familyId) =>
            setExpandedIds((current) => new Set([...current, familyId]))
          }
          onCollapseNode={(familyId) =>
            setExpandedIds((current) => {
              const next = new Set(current);
              next.delete(familyId);
              return next;
            })
          }
          onStartRename={() => undefined}
          onRenameDraftChange={() => undefined}
          onCommitRename={() => undefined}
          onCancelRename={() => undefined}
          onEdit={() => undefined}
          onDelete={() => undefined}
          onCreateChild={() => undefined}
        />
      </PanelBody>
    </Panel>
  );

  const itemDetail = (
    <Panel className="h-full rounded-none border-0 shadow-none">
      <PanelHeader
        title={`Item #${currentItem?.rowIndex ?? "—"}`}
        description={currentItem?.reviewStatus ?? "No item loaded"}
      />
      <PanelBody className="space-y-4">
        {!context.hasAiRun ? (
          <div
            aria-live="polite"
            className="rounded-md border border-dashed border-border px-3 py-2"
          >
            <Text size="sm" variant="muted">
              Run AI on this batch before reviewing suggestions.
            </Text>
          </div>
        ) : null}
        {currentItem ? (
          <>
            <div>
              <Text size="sm" variant="muted">
                Description
              </Text>
              <Text className="mt-1 text-base leading-relaxed">
                {currentItem.description ?? "—"}
              </Text>
            </div>
            <PropertyGrid
              columns={2}
              items={[
                { id: "unit", label: "Unit", value: currentItem.unit ?? "—" },
                {
                  id: "qty",
                  label: "Quantity",
                  value: currentItem.quantity ?? "—",
                },
                {
                  id: "section",
                  label: "Section",
                  value: currentItem.section ?? "TBD",
                },
                {
                  id: "discipline",
                  label: "Discipline",
                  value: currentItem.discipline ?? "TBD",
                },
                {
                  id: "mapping",
                  label: "Existing mapping",
                  value: currentItem.existingMappingPath ?? "(none)",
                  fullWidth: true,
                },
                {
                  id: "selected",
                  label: "Selected family",
                  value: selectedFamilyPath,
                  fullWidth: true,
                },
              ]}
            />
          </>
        ) : (
          <Text variant="muted">No items in the review queue.</Text>
        )}
      </PanelBody>
    </Panel>
  );

  const assistance = (
    <Panel className="h-full rounded-none border-0 shadow-none">
      <PanelHeader title="Assistance" />
      <PanelBody className="space-y-6">
        <section>
          <Text size="sm" weight="medium" className="mb-2">
            AI suggestions
          </Text>
          <AiSuggestionList
            suggestions={currentItem?.aiSuggestions ?? []}
            selectedFamilyId={selectedFamilyId}
            onAccept={(familyId) => acceptSuggestion(
              currentItem?.aiSuggestions.findIndex((s) => s.familyId === familyId) ?? 0,
            )}
          />
        </section>
        <section>
          <Text size="sm" weight="medium" className="mb-2">
            Similar items
          </Text>
          <SimilarItemsList
            items={currentItem?.similarItems ?? []}
            onBulkApprove={
              selectedFamilyId ? () => void handleBulkApproveSimilar() : undefined
            }
          />
        </section>
        <section>
          <Text size="sm" weight="medium" className="mb-2">
            Prior decisions
          </Text>
          <PriorDecisionsList decisions={currentItem?.priorDecisions ?? []} />
        </section>
      </PanelBody>
    </Panel>
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col outline-none"
      tabIndex={-1}
      aria-live="polite"
    >
      <TableToolbar>
        <TableToolbarGroup>
          <Text weight="medium">{context.batch.name}</Text>
          <Text variant="muted" size="sm">
            {context.reviewedCount} / {context.totalCount} reviewed
          </Text>
          {context.batch.versionName ? (
            <Text variant="muted" size="sm">
              · {context.batch.versionName}
            </Text>
          ) : null}
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            {context.batch.workflowStage.replaceAll("_", " ")}
          </span>
        </TableToolbarGroup>
        <TableToolbarSpacer />
        <TableToolbarGroup>
          {(context.batch.workflowStage === "ready_for_engineer_review" ||
            context.batch.workflowStage === "imported") && (
            <Button
              size="sm"
              variant="secondary"
              disabled={submittingReview || context.batch.itemsPendingReviewCount > 0}
              onClick={() => void handleSubmitEngineerReview()}
            >
              {submittingReview ? "Submitting…" : "Submit for section-head review"}
            </Button>
          )}
          {context.batch.workflowStage === "awaiting_section_head" && (
            <>
              <Button
                size="sm"
                disabled={approvingVersion}
                onClick={() => void handleApproveVersion()}
              >
                {approvingVersion
                  ? "Approving…"
                  : `Approve as Version ${context.batch.versionNumber ?? 1}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={returningToEngineer}
                onClick={() => void handleReturnToEngineer()}
              >
                {returningToEngineer ? "Returning…" : "Return to engineer"}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={runningAi}
            onClick={() => void handleRunAi()}
          >
            {runningAi ? "Running AI…" : "Run AI"}
          </Button>
          <Button
            size="sm"
            disabled={publishing}
            onClick={() => void handlePublish()}
          >
            {publishing ? "Publishing…" : "Publish approved"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/workshop")}>
            Back
          </Button>
        </TableToolbarGroup>
      </TableToolbar>

      {context.batch.returnToEngineerNotes ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          Section-head notes: {context.batch.returnToEngineerNotes}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col p-[var(--space-shell)]">
        <SplitPane
          defaultLeftPercent={25}
          minLeftPercent={20}
          maxLeftPercent={35}
          left={familyPicker}
          right={
            <SplitPane
              defaultLeftPercent={66}
              minLeftPercent={50}
              maxLeftPercent={75}
              left={itemDetail}
              right={assistance}
            />
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card px-4 py-2">
        <Button size="sm" variant="outline" onClick={() => void navigatePrevious()}>
          Previous
        </Button>
        <Button size="sm" variant="outline" onClick={() => void navigateNext()}>
          Next
        </Button>
        <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
          Save <KeyboardShortcut keys={["⌘", "S"]} className="ml-2" />
        </Button>
        <Button size="sm" disabled={saving} onClick={() => void handleSaveAndNext()}>
          Save & Next <KeyboardShortcut keys={["⌘", "Enter"]} className="ml-2" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => void handleSkip()}>
          Skip
        </Button>
        <Button size="sm" variant="ghost" disabled={!canUndo} onClick={() => undo()}>
          Undo
        </Button>
        <Button size="sm" variant="ghost" disabled={!canRedo} onClick={() => redo()}>
          Redo
        </Button>
        <Text variant="muted" size="xs" className="ml-auto">
          Enter accept · 1-3 alt suggestions · ←/→ navigate
        </Text>
      </div>
    </div>
  );
}
