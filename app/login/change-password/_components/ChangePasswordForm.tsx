"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/app/login/change-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ChangePasswordActionState,
    FormData
  >(changePasswordAction, {});

  useEffect(() => {
    if (!state.success) return;
    router.replace("/");
    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Updating password..." : "Set new password"}
      </Button>
    </form>
  );
}
