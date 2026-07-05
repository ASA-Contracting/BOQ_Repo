import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { tryGetSupabaseEnv } from "@/infrastructure/config/env";

export async function createClient() {
  const env = tryGetSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing or invalid Supabase environment variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
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
          // Called from a Server Component — middleware handles refresh.
        }
      },
    },
  });
}
