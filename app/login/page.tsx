import { LoginForm } from "@/app/login/_components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your Supabase email and password account.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
