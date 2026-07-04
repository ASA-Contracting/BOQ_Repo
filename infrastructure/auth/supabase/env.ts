import { resolveEnv } from "@supabase/server/core";
import type { SupabaseEnv } from "@supabase/server";

import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

export function resolveSupabaseServerEnv(): {
  data: SupabaseEnv;
  error: null;
} | {
  data: null;
  error: Error;
} {
  const config = tryGetSupabaseEnv();

  if (!config) {
    return {
      data: null,
      error: new Error(
        "Missing or invalid Supabase environment variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY",
      ),
    };
  }

  const { data, error } = resolveEnv({
    url: config.SUPABASE_URL,
    publishableKeys: { default: config.SUPABASE_PUBLISHABLE_KEY },
    secretKeys: config.SUPABASE_SECRET_KEY
      ? { default: config.SUPABASE_SECRET_KEY }
      : undefined,
    jwks: config.SUPABASE_JWKS_URL
      ? new URL(config.SUPABASE_JWKS_URL)
      : undefined,
  });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
