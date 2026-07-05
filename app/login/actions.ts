"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/infrastructure/auth/supabase/server";
import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

const AUTH_NOT_CONFIGURED_MESSAGE =
  "Sign-in is not configured on this server. Add Supabase environment variables in Vercel and redeploy.";

export async function signInAction(
  _previousState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!tryGetSupabaseEnv()) {
    return { error: AUTH_NOT_CONFIGURED_MESSAGE };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
