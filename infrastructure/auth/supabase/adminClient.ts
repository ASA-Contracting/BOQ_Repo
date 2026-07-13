import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

let adminClient: SupabaseClient | undefined;

export function createSupabaseAdminClient(): SupabaseClient | null {
  const env = tryGetSupabaseEnv();
  if (!env?.SUPABASE_SECRET_KEY) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function resetSupabaseAdminClientForTests(): void {
  adminClient = undefined;
}
