"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  createFamilyAction,
  updateFamilyAction,
} from "@/app/(dashboard)/families/actions";
import { buildParentOptions } from "@/app/(dashboard)/families/_lib/tree-utils";
import type { FamilyTreeNodeData } from "@/app/(dashboard)/families/_lib/tree-utils";
import type {
  FamilyDetailDto,
  FamilyLevelTypeDto,
} from "@/application/dto/family/familyDto";
import {
  FamilyFormFields,
  createEmptyFamilyFormValues,
  familyDetailToFormValues,
  type FamilyFormValues,
} from "@/components/family/FamilyFormFields";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineError } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";

type FamilyFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  tree: FamilyTreeNodeData[];
  levelTypes: FamilyLevelTypeDto[];
  initialFamily: FamilyDetailDto | null;
  defaultParentId: number | null;
  onClose: () => void;
  onSuccess: (family: FamilyDetailDto) => void;
};

function buildInitialValues(
  mode: "create" | "edit",
  initialFamily: FamilyDetailDto | null,
  defaultParentId: number | null,
  levelTypes: FamilyLevelTypeDto[],
): FamilyFormValues {
  if (mode === "edit" && initialFamily) {
    return familyDetailToFormValues(initialFamily);
  }

  return createEmptyFamilyFormValues({
    familyLevelTypeId: levelTypes[0] ? String(levelTypes[0].id) : "",
    parentId: defaultParentId ? String(defaultParentId) : "",
  });
}

function mapFieldErrors(
  details: Record<string, unknown> | undefined,
  message: string,
): Partial<Record<keyof FamilyFormValues, string>> {
  const field = details?.field;
  if (typeof field !== "string") {
    return {};
  }

  if (
    field === "name" ||
    field === "referenceCode" ||
    field === "description" ||
    field === "familyLevelTypeId" ||
    field === "parentId"
  ) {
    return { [field]: message };
  }

  return {};
}

export function FamilyFormDialog({
  mode,
  open,
  tree,
  levelTypes,
  initialFamily,
  defaultParentId,
  onClose,
  onSuccess,
}: FamilyFormDialogProps) {
  const initialValues = useMemo(
    () => buildInitialValues(mode, initialFamily, defaultParentId, levelTypes),
    [defaultParentId, initialFamily, levelTypes, mode],
  );
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FamilyFormValues, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOptions = useMemo(
    () => buildParentOptions(tree, initialFamily?.id),
    [initialFamily?.id, tree],
  );

  function updateField(field: keyof FamilyFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    if (mode === "edit" && initialFamily) {
      formData.set("id", String(initialFamily.id));
    }

    const response =
      mode === "create"
        ? await createFamilyAction(formData)
        : await updateFamilyAction(formData);

    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error.message);
      setFieldErrors(
        mapFieldErrors(response.error.details, response.error.message),
      );
      return;
    }

    onSuccess(response.data);
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={mode === "create" ? "Create family" : "Edit family"}
      description={
        mode === "create"
          ? "Add a new family to the hierarchy."
          : "Update the selected family."
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create family"
            ) : (
              "Save changes"
            )}
          </Button>
        </>
      }
    >
      {mode === "edit" && initialFamily ? (
        <input type="hidden" name="id" value={initialFamily.id} />
      ) : null}

      <FamilyFormFields
        levelTypes={levelTypes}
        parentOptions={parentOptions}
        values={values}
        fieldErrors={fieldErrors}
        onChange={updateField}
        disabled={isSubmitting}
      />

      {error ? <InlineError message={error} className="mt-4 text-sm" /> : null}
    </Dialog>
  );
}
