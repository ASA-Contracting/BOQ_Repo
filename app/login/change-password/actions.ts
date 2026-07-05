"use server";

import { changePasswordSchema } from "@/application/dto/user/passwordSchema";
import { CompleteMandatoryPasswordChangeUseCase } from "@/application/use-cases/auth/CompleteMandatoryPasswordChangeUseCase";
import { createClient } from "@/infrastructure/auth/supabase/server";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

const AUTH_NOT_CONFIGURED_MESSAGE =
  "Sign-in is not configured on this server. Add Supabase environment variables in Vercel and redeploy.";

export type ChangePasswordActionState = {
  error?: string;
  success?: boolean;
};

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  if (!tryGetSupabaseEnv()) {
    return { error: AUTH_NOT_CONFIGURED_MESSAGE };
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    return { error: "Authentication is required." };
  }

  const parsed = changePasswordSchema.safeParse({
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const useCase = new CompleteMandatoryPasswordChangeUseCase({
    userAdminRepository: getAppServices().userAdmin.userAdminRepository,
    updatePassword: async (newPassword) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    },
  });

  const result = await useCase.execute(ctx, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  return { success: true };
}
