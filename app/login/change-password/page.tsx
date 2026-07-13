import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/app/login/change-password/_components/ChangePasswordForm";
import { isAuthSkipped, tryGetSupabaseEnv } from "@/infrastructure/config/env";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  if (isAuthSkipped()) {
    redirect("/");
  }

  const authConfigured = Boolean(tryGetSupabaseEnv());

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account uses a temporary password. Choose a new password to
            continue.
          </p>
        </div>
        {!authConfigured ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Sign-in is not configured on this server.
          </p>
        ) : (
          <ChangePasswordForm />
        )}
      </div>
    </main>
  );
}
