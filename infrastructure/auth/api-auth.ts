import { createAppSupabaseContext } from "@/infrastructure/auth/supabase/context";
import { isAuthSkipped } from "@/infrastructure/config/env";

export async function requireAuthUserId(): Promise<string | null> {
  if (isAuthSkipped()) {
    return "dev-user";
  }

  const { data: ctx, error } = await createAppSupabaseContext({ auth: "user" });
  if (error || !ctx?.userClaims?.id) {
    return null;
  }

  return ctx.userClaims.id;
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, message }, { status });
}

export function apiSuccess<T>(data: T, message = "OK") {
  return Response.json({ success: true, message, data });
}
