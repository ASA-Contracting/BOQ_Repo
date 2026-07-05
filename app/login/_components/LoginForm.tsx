"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { signInAction, type SignInActionState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SignInActionState, FormData>(
    signInAction,
    {},
  );

  useEffect(() => {
    if (!state.success) return;
    router.replace("/");
    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={disabled || isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={disabled || isPending}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={disabled || isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
