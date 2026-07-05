"use server";

import { createClient } from "@/infrastructure/auth/supabase/server";
import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

const AUTH_NOT_CONFIGURED_MESSAGE =
  "Sign-in is not configured on this server. Add Supabase environment variables in Vercel and redeploy.";

const AUTH_UNAVAILABLE_MESSAGE =
  "Could not reach the authentication service. Check your network connection and Supabase URL, then try again.";

export type SignInActionState = {
  error?: string;
  success?: boolean;
};

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  if (!tryGetSupabaseEnv()) {
    return { error: AUTH_NOT_CONFIGURED_MESSAGE };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: AUTH_UNAVAILABLE_MESSAGE };
  }

  return { success: true };
}
