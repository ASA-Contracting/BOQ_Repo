"use client";

import { useMemo, useState, type FormEvent } from "react";

import type {
  RoleCatalogDto,
  UserSummaryDto,
  UserWithTemporaryPasswordDto,
} from "@/application/dto/user/userDto";
import { formatRoleLabel } from "@/application/dto/user/roleCatalog";
import type { Role } from "@/domain/shared/Role";
import { ROLES } from "@/domain/shared/Role";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { InlineError } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";

type UserFormDialogProps = {
  mode: "invite" | "edit";
  open: boolean;
  user: UserSummaryDto | null;
  roleCatalog: RoleCatalogDto;
  onClose: () => void;
  onSuccess: (user: UserSummaryDto, temporaryPassword?: string) => void;
};

type FormValues = {
  email: string;
  displayName: string;
  roles: Role[];
  isActive: boolean;
};

function buildInitialValues(
  mode: "invite" | "edit",
  user: UserSummaryDto | null,
): FormValues {
  if (mode === "edit" && user) {
    return {
      email: user.email,
      displayName: user.displayName ?? "",
      roles: [...user.roles],
      isActive: user.isActive,
    };
  }

  return {
    email: "",
    displayName: "",
    roles: ["viewer"],
    isActive: true,
  };
}

export function UserFormDialog({
  mode,
  open,
  user,
  roleCatalog,
  onClose,
  onSuccess,
}: UserFormDialogProps) {
  const initialValues = useMemo(
    () => buildInitialValues(mode, user),
    [mode, user],
  );
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = roleCatalog.roles.length > 0
    ? roleCatalog.roles
    : ROLES.map((role) => ({
        id: role,
        label: formatRoleLabel(role),
        description: "",
        permissions: [],
      }));

  function toggleRole(role: Role, checked: boolean) {
    setValues((current) => {
      const nextRoles = checked
        ? [...new Set([...current.roles, role])]
        : current.roles.filter((entry) => entry !== role);
      return {
        ...current,
        roles: nextRoles.length > 0 ? nextRoles : current.roles,
      };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        mode === "invite"
          ? await fetch("/api/v1/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: values.email.trim(),
                displayName: values.displayName.trim() || undefined,
                roles: values.roles,
              }),
            })
          : await fetch(`/api/v1/users/${user?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                displayName: values.displayName.trim() || null,
                roles: values.roles,
                isActive: values.isActive,
              }),
            });

      const payload = (await response.json().catch(() => null)) as {
        data?: UserSummaryDto | UserWithTemporaryPasswordDto;
        error?: { message?: string };
      } | null;

      if (!payload) {
        setError("Unable to save user. The server returned an invalid response.");
        return;
      }

      if (!response.ok) {
        setError(payload.error?.message ?? "Unable to save user.");
        return;
      }

      if (!payload.data) {
        setError("Save succeeded but no user was returned.");
        return;
      }

      const temporaryPassword =
        mode === "invite" &&
        payload.data &&
        "temporaryPassword" in payload.data &&
        typeof payload.data.temporaryPassword === "string"
          ? payload.data.temporaryPassword
          : undefined;

      onSuccess(payload.data, temporaryPassword);
      onClose();
    } catch {
      setError("Network error while saving user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={mode === "invite" ? "Add user" : "Edit user"}
      description={
        mode === "invite"
          ? "Create an account with a system-generated temporary password."
          : "Update display name, roles, and account status."
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {mode === "invite" ? "Create user" : "Save changes"}
          </Button>
        </>
      }
    >
      {error ? <InlineError message={error} /> : null}

      {mode === "invite" ? (
        <label className="block space-y-1.5">
          <Text size="sm" weight="medium">
            Email
          </Text>
          <Input
            type="email"
            required
            autoComplete="off"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>
      ) : (
        <label className="block space-y-1.5">
          <Text size="sm" weight="medium">
            Email
          </Text>
          <Input type="email" value={values.email} disabled />
        </label>
      )}

      <label className="mt-4 block space-y-1.5">
        <Text size="sm" weight="medium">
          Display name
        </Text>
        <Input
          type="text"
          autoComplete="off"
          value={values.displayName}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              displayName: event.target.value,
            }))
          }
        />
      </label>

      <fieldset className="mt-4 space-y-2">
        <legend>
          <Text size="sm" weight="medium">
            Roles
          </Text>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roleOptions.map((role) => {
            const checked = values.roles.includes(role.id);
            return (
              <label
                key={role.id}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) =>
                    toggleRole(role.id, next === true)
                  }
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <Text size="sm" weight="medium">
                    {role.label}
                  </Text>
                  {role.description ? (
                    <Text variant="muted" size="xs" className="mt-0.5">
                      {role.description}
                    </Text>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {mode === "edit" ? (
        <label className="mt-4 flex items-center gap-2">
          <Checkbox
            checked={values.isActive}
            onCheckedChange={(next) =>
              setValues((current) => ({
                ...current,
                isActive: next === true,
              }))
            }
          />
          <Text size="sm">Account is active</Text>
        </label>
      ) : null}
    </Dialog>
  );
}
