import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/infrastructure/config/env";

export function createClient() {
  const env = getSupabaseEnv();

  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
}
