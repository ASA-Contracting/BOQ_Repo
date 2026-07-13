"use server";

import { createClient } from "@/infrastructure/auth/supabase/server";
import { isAuthSkipped, tryGetSupabaseEnv } from "@/infrastructure/config/env";

const AUTH_NOT_CONFIGURED_MESSAGE =
  "Sign-in is not configured on this server. Add Supabase environment variables in Vercel and redeploy.";

const AUTH_UNAVAILABLE_MESSAGE =
  "Could not reach the authentication service. Check your network connection and Supabase URL, then try again.";

export type SignInActionState = {
  error?: string;
  success?: boolean;
  mustChangePassword?: boolean;
};

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  if (!tryGetSupabaseEnv()) {
    if (isAuthSkipped()) {
      return { success: true };
    }

    return { error: AUTH_NOT_CONFIGURED_MESSAGE };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    const mustChangePassword =
      data.user?.user_metadata?.must_change_password === true;

    return { success: true, mustChangePassword };
  } catch {
    return { error: AUTH_UNAVAILABLE_MESSAGE };
  }
}
