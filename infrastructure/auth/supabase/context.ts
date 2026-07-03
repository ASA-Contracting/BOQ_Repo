import { createServerClient } from "@supabase/ssr";
import {
  createAdminClient,
  createContextClient,
  verifyCredentials,
} from "@supabase/server/core";
import type { AuthModeWithKey, SupabaseContext } from "@supabase/server";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/infrastructure/config/env";
import { resolveSupabaseServerEnv } from "@/infrastructure/auth/supabase/env";

export type CreateAppSupabaseContextOptions = {
  auth?: AuthModeWithKey | AuthModeWithKey[];
};

export async function createAppSupabaseContext(
  options: CreateAppSupabaseContextOptions = { auth: "user" },
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  const { data: env, error: envError } = resolveSupabaseServerEnv();

  if (envError || !env) {
    return { data: null, error: envError ?? new Error("Supabase env not configured") };
  }

  const config = getSupabaseEnv();
  const cookieStore = await cookies();
  const ssrClient = createServerClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies — middleware handles refresh.
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  const token = session?.access_token ?? null;

  const { data: auth, error } = await verifyCredentials(
    { token, apikey: null },
    { auth: options.auth ?? "user", env },
  );

  if (error) {
    return { data: null, error };
  }

  const supabase = createContextClient({
    auth: { token: auth!.token, keyName: auth!.keyName },
    env,
  });
  const supabaseAdmin = createAdminClient({ env });

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims: auth!.userClaims,
      jwtClaims: auth!.jwtClaims,
      authMode: auth!.authMode,
      authKeyName: auth!.keyName ?? undefined,
    },
    error: null,
  };
}
