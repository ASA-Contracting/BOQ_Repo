"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { updateFamilyAction } from "@/app/(dashboard)/families/actions";
import { DetailSkeleton } from "@/app/(dashboard)/families/_components/LoadingState";
import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
} from "@/components/ui/panel";
import { PropertyGrid } from "@/components/ui/property-grid";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";

type FamilyDetailPanelProps = {
  family: FamilyDetailDto | null;
  isLoading: boolean;
  error: string | null;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdated: (family: FamilyDetailDto) => void;
  onUpdateError: (message: string) => void;
};

type InlineField = "name" | "referenceCode" | "description";

export function FamilyDetailPanel({
  family,
  isLoading,
  error,
  canManage,
  onEdit,
  onDelete,
  onUpdated,
  onUpdateError,
}: FamilyDetailPanelProps) {
  const [editingField, setEditingField] = useState<InlineField | null>(null);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditingField(null);
    setDraft("");
  }, [family?.id]);

  function startInlineEdit(field: InlineField) {
    if (!canManage || !family || isSaving) {
      return;
    }

    const initial =
      field === "name"
        ? family.name
        : field === "referenceCode"
          ? family.referenceCode ?? ""
          : family.description ?? "";

    setDraft(initial);
    setEditingField(field);
  }

  async function commitInlineEdit() {
    if (!family || !editingField || isSaving) {
      return;
    }

    const trimmed = draft.trim();
    const current =
      editingField === "name"
        ? family.name
        : editingField === "referenceCode"
          ? family.referenceCode ?? ""
          : family.description ?? "";

    if (trimmed === current.trim()) {
      setEditingField(null);
      return;
    }

    if (editingField === "name" && trimmed.length === 0) {
      onUpdateError("Name is required.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.set("id", String(family.id));

    if (editingField === "name") {
      formData.set("name", trimmed);
    } else if (editingField === "referenceCode") {
      formData.set("referenceCode", trimmed);
    } else {
      formData.set("description", trimmed);
    }

    const response = await updateFamilyAction(formData);
    setIsSaving(false);
    setEditingField(null);

    if (!response.success) {
      onUpdateError(response.error.message);
      return;
    }

    onUpdated(response.data);
  }

  function cancelInlineEdit() {
    setEditingField(null);
    setDraft("");
  }

  function renderInlineValue(
    field: InlineField,
    display: string,
    multiline = false,
  ) {
    if (editingField === field) {
      if (multiline) {
        return (
          <Textarea
            autoFocus
            value={draft}
            disabled={isSaving}
            className="min-h-24 text-sm"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                cancelInlineEdit();
              }
              if (event.key === "Enter" && event.metaKey) {
                event.preventDefault();
                void commitInlineEdit();
              }
            }}
            onBlur={() => void commitInlineEdit()}
          />
        );
      }

      return (
        <Input
          autoFocus
          value={draft}
          disabled={isSaving}
          inputSize="sm"
          className="text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitInlineEdit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelInlineEdit();
            }
          }}
          onBlur={() => void commitInlineEdit()}
        />
      );
    }

    return (
      <button
        type="button"
        className="focus-ring -mx-1 w-full rounded-sm px-1 py-0.5 text-left text-sm transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
        disabled={!canManage}
        onDoubleClick={() => startInlineEdit(field)}
        title={canManage ? "Double-click to edit" : undefined}
      >
        {display}
      </button>
    );
  }

  return (
    <Panel padding className="h-full border-0 shadow-none">
      <PanelHeader
        title={family?.name ?? "Details"}
        description={
          family
            ? family.referenceCode ?? "Family record"
            : "Select a family to inspect its properties."
        }
      />

      <PanelBody>
        {isLoading ? <DetailSkeleton /> : null}

        {error ? <InlineError message={error} className="text-sm" /> : null}

        {!isLoading && !error && !family ? (
          <EmptyState
            compact
            icon={FileText}
            title="No family selected"
            description="Choose a family from the tree or search results to view its details."
          />
        ) : null}

        {family && !isLoading ? (
          <PropertyGrid
            columns={1}
            labelWidth="7rem"
            items={[
              {
                id: "name",
                label: "Name",
                value: renderInlineValue("name", family.name),
                fullWidth: true,
              },
              {
                id: "referenceCode",
                label: "Reference code",
                value: renderInlineValue(
                  "referenceCode",
                  family.referenceCode ?? "—",
                ),
                fullWidth: true,
              },
              {
                id: "levelType",
                label: "Level type",
                value: (
                  <Badge variant="outline" className="font-normal">
                    {family.familyLevelTypeName}
                  </Badge>
                ),
                fullWidth: true,
              },
              {
                id: "parent",
                label: "Parent",
                value: family.parent ? family.parent.name : "Root family",
                fullWidth: true,
              },
              {
                id: "description",
                label: "Description",
                value: renderInlineValue(
                  "description",
                  family.description ?? "No description provided.",
                  true,
                ),
                fullWidth: true,
              },
            ]}
          />
        ) : null}

        {canManage && family && !isLoading ? (
          <Text variant="muted" size="xs" className="mt-4">
            Double-click name, reference code, or description to edit inline.
          </Text>
        ) : null}
      </PanelBody>

      {canManage && family && !isLoading ? (
        <PanelFooter className="justify-start">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit all fields
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </PanelFooter>
      ) : null}
    </Panel>
  );
}
