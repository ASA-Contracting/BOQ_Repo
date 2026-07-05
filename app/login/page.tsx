import { LoginForm } from "@/app/login/_components/LoginForm";
import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const authConfigured = Boolean(tryGetSupabaseEnv());

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your Supabase email and password account.
          </p>
        </div>
        {!authConfigured ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Sign-in is not configured on this server. Add Supabase environment
            variables in Vercel, then redeploy.
          </p>
        ) : null}
        <LoginForm disabled={!authConfigured} />
      </div>
    </main>
  );
}
