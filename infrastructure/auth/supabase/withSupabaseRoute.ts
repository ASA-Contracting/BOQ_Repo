import { createSupabaseContext as createHeaderSupabaseContext } from "@supabase/server";
import type { AuthModeWithKey, SupabaseContext, WithSupabaseConfig } from "@supabase/server";

import { createAppSupabaseContext } from "@/infrastructure/auth/supabase/context";

type RouteAuthConfig = Pick<WithSupabaseConfig, "auth" | "env">;

/**
 * Next.js App Router adapter for `withSupabase`.
 * Uses cookie sessions (via @supabase/ssr) in Route Handlers and Server Components.
 */
export function withSupabaseRoute(
  config: RouteAuthConfig,
  handler: (req: Request, ctx: SupabaseContext) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { data: ctx, error } = await createAppSupabaseContext({
      auth: config.auth ?? "user",
    });

    if (error) {
      const status = "status" in error ? (error.status as number) : 401;
      return Response.json(
        { error: { message: error.message } },
        { status },
      );
    }

    return handler(req, ctx);
  };
}

/**
 * Header-based auth for standard `Request` handlers (Authorization / apikey headers).
 * Use in Edge-style handlers or when clients send Bearer tokens directly.
 */
export function withSupabaseHeaderRoute(
  config: RouteAuthConfig,
  handler: (req: Request, ctx: SupabaseContext) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { data: ctx, error } = await createHeaderSupabaseContext(req, config);

    if (error) {
      return Response.json(
        { error: { message: error.message } },
        { status: error.status },
      );
    }

    return handler(req, ctx);
  };
}

export type { AuthModeWithKey, SupabaseContext };
