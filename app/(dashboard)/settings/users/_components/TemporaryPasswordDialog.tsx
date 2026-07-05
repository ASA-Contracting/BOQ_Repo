"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

import type { UserSummaryDto } from "@/application/dto/user/userDto";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Text } from "@/components/ui/typography";

type TemporaryPasswordDialogProps = {
  open: boolean;
  user: UserSummaryDto | null;
  temporaryPassword: string;
  mode: "create" | "reset";
  onClose: () => void;
};

export function TemporaryPasswordDialog({
  open,
  user,
  temporaryPassword,
  mode,
  onClose,
}: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={mode === "create" ? "User created" : "Temporary password generated"}
      description={
        mode === "create"
          ? "Share this one-time temporary password with the user. They must change it on first sign-in."
          : "Share this new temporary password with the user. Their previous password no longer works."
      }
      onClose={onClose}
      size="md"
      footer={
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      }
    >
      {user ? (
        <div className="space-y-4">
          <div>
            <Text variant="muted" size="sm">
              Account
            </Text>
            <Text size="sm" weight="medium">
              {user.email}
            </Text>
          </div>

          <div>
            <Text variant="muted" size="sm">
              Temporary password
            </Text>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <code className="flex-1 break-all font-mono text-sm">
                {temporaryPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <Text variant="muted" size="xs">
            This password is shown only once. Use &quot;Reset password&quot; in
            user settings if the user forgets it.
          </Text>
        </div>
      ) : null}
    </Dialog>
  );
}
