"use client";

import { useState } from "react";

import { deleteFamilyAction } from "@/app/(dashboard)/families/actions";
import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteFamilyDialogProps = {
  open: boolean;
  family: FamilyDetailDto | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteFamilyDialog({
  open,
  family,
  onClose,
  onSuccess,
}: DeleteFamilyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!family) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await deleteFamilyAction(family.id);
    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <ConfirmDialog
      open={open}
      title="Delete family"
      description={
        family
          ? `Permanently delete "${family.name}" when it has no child families and no production or workshop references.`
          : "Permanently delete this family when it has no child families and no references."
      }
      confirmLabel="Delete family"
      destructive
      isSubmitting={isSubmitting}
      error={error}
      onConfirm={handleDelete}
      onClose={() => {
        setError(null);
        onClose();
      }}
    />
  );
}
