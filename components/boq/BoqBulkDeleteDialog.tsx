"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type BoqBulkDeleteDialogProps = {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function BoqBulkDeleteDialog({
  open,
  count,
  onClose,
  onConfirm,
}: BoqBulkDeleteDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedValue = String(count);
  const confirmationMatches = confirmationInput.trim() === expectedValue;

  useEffect(() => {
    if (!open) {
      setConfirmationInput("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleDelete() {
    if (!confirmationMatches) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete selected BOQs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const recordLabel = count === 1 ? "record" : "records";

  return (
    <Dialog
      open={open}
      title={count === 1 ? "Delete BOQ" : "Delete selected BOQs"}
      description={`This will permanently remove ${count} ${recordLabel} from the master list. This action cannot be undone.`}
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={!confirmationMatches || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Deleting...
              </>
            ) : (
              `Delete ${count} ${recordLabel}`
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          Type{" "}
          <strong className="font-semibold tabular-nums">{expectedValue}</strong> to confirm you want
          to delete {count} selected {recordLabel}.
        </p>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={`Type ${expectedValue} to confirm deletion`}
          placeholder={expectedValue}
          value={confirmationInput}
          onChange={(event) => setConfirmationInput(event.target.value)}
          disabled={isSubmitting}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
