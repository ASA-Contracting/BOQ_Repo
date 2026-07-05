"use client";

import { useState } from "react";

import type { UserSummaryDto } from "@/application/dto/user/userDto";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteUserDialogProps = {
  open: boolean;
  user: UserSummaryDto | null;
  onClose: () => void;
  onSuccess: (userId: string) => void;
};

function formatUserLabel(user: UserSummaryDto): string {
  return user.displayName ? `${user.displayName} (${user.email})` : user.email;
}

export function DeleteUserDialog({
  open,
  user,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users/${user.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        setError(payload.error?.message ?? "Unable to delete user.");
        return;
      }

      onSuccess(user.id);
      onClose();
    } catch {
      setError("Network error while deleting user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Delete user"
      description={
        user
          ? `Permanently delete ${formatUserLabel(user)} from Supabase Auth. This action cannot be undone.`
          : "Permanently delete this user from Supabase Auth. This action cannot be undone."
      }
      confirmLabel="Delete user"
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
