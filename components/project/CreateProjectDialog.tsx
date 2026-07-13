"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { createProjectAction } from "@/app/(dashboard)/projects/actions";
import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import { OwnerPicker } from "@/components/project/OwnerPicker";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Text } from "@/components/ui/typography";
import { useBoqLookupOptions } from "@/hooks/use-boq-lookup-options";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: ProjectDetailDto) => void;
  /** Pre-fills project title when opening (e.g. typed name from import picker). */
  initialName?: string;
};

const EMPTY_FORM = {
  name: "",
  client: "",
  clientId: undefined as number | undefined,
  description: "",
  ownerType: "",
  tenderStatus: "",
  country: "",
  assignedTo: "",
};

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
  initialName = "",
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { items: ownerTypeOptions } = useBoqLookupOptions("owner_type", { enabled: open });
  const { items: statusOptions } = useBoqLookupOptions("tender_status", { enabled: open });
  const { items: countryOptions } = useBoqLookupOptions("country", { enabled: open });
  const { items: assigneeOptions } = useBoqLookupOptions("assigned_to", { enabled: open });

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      ...EMPTY_FORM,
      name: initialName.trim(),
    });
    setError(null);
  }, [initialName, open]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    resetForm();
    onClose();
  }

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const assignedTo =
      form.assignedTo.trim() && form.assignedTo.toLowerCase() !== "unassigned"
        ? form.assignedTo.trim()
        : null;

    const result = await createProjectAction({
      name: form.name,
      ...(form.clientId != null
        ? { clientId: form.clientId }
        : { client: form.client }),
      description: form.description.trim() ? form.description : null,
      ownerType: form.ownerType.trim() ? form.ownerType : null,
      tenderStatus: form.tenderStatus.trim() ? form.tenderStatus : null,
      country: form.country.trim() ? form.country : null,
      assignedTo,
    });

    setSubmitting(false);

    if (!result.success || !result.data) {
      setError(result.success ? "Failed to create project." : result.error.message);
      return;
    }

    resetForm();
    onCreated?.(result.data);
    router.refresh();
    onClose();
  }

  return (
    <DialogRoot open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md" className="max-h-[min(92vh,720px)] overflow-hidden">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <Text variant="muted" size="sm" className="mt-0.5">
              Add a tender project with owner, status, country, and assignment.
            </Text>
          </DialogHeader>

          <DialogBody className="space-y-4 overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-project-name">Project title</Label>
                <Input
                  id="create-project-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  maxLength={150}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <OwnerPicker
                  id="create-project-client"
                  active={open}
                  value={{ client: form.client, clientId: form.clientId }}
                  onChange={(selection) => {
                    setForm((current) => ({
                      ...current,
                      client: selection.client,
                      clientId: selection.clientId,
                    }));
                  }}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-project-owner-type">Owner type</Label>
                <Select
                  id="create-project-owner-type"
                  value={form.ownerType}
                  onChange={(event) => updateField("ownerType", event.target.value)}
                  disabled={submitting}
                >
                  <SelectOption value="">Optional</SelectOption>
                  {ownerTypeOptions.map((option) => (
                    <SelectOption key={option.id} value={option.name}>
                      {option.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-project-status">Status</Label>
                <Select
                  id="create-project-status"
                  value={form.tenderStatus}
                  onChange={(event) => updateField("tenderStatus", event.target.value)}
                  disabled={submitting}
                >
                  <SelectOption value="">—</SelectOption>
                  {statusOptions.map((option) => (
                    <SelectOption key={option.id} value={option.name}>
                      {option.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-project-country">Country</Label>
                <Select
                  id="create-project-country"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  disabled={submitting}
                >
                  <SelectOption value="">Optional</SelectOption>
                  {countryOptions.map((option) => (
                    <SelectOption key={option.id} value={option.name}>
                      {option.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-project-assigned-to">Assign to</Label>
                <Select
                  id="create-project-assigned-to"
                  value={form.assignedTo}
                  onChange={(event) => updateField("assignedTo", event.target.value)}
                  disabled={submitting}
                >
                  <SelectOption value="">Leave blank for Unassigned</SelectOption>
                  {assigneeOptions.map((option) => (
                    <SelectOption key={option.id} value={option.name}>
                      {option.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-project-description">Description</Label>
                <Input
                  id="create-project-description"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  maxLength={2000}
                  disabled={submitting}
                  placeholder="Optional"
                />
              </div>
            </div>

            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          </DialogBody>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.client.trim()}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
