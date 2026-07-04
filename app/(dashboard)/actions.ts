"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/infrastructure/auth/supabase/server";

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function refreshSessionAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  revalidatePath("/settings");
}
