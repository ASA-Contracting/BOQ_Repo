"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/infrastructure/auth/supabase/server";

export async function signInAction(
  _previousState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
