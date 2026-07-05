import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/infrastructure/config/env";
import { createCorrelationId } from "@/infrastructure/auth/correlationId";
import {
  CORRELATION_ID_HEADER,
  readCorrelationIdHeader,
} from "@/infrastructure/http/correlationId";
import { toCorrelationId } from "@/domain/shared/ids";

function attachCorrelationId(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const incoming = readCorrelationIdHeader(request.headers);
  const correlationId = incoming
    ? toCorrelationId(incoming)
    : createCorrelationId();

  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let supabaseEnv: ReturnType<typeof getSupabaseEnv>;
  try {
    supabaseEnv = getSupabaseEnv();
  } catch {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/login") || pathname.startsWith("/api/health")) {
      return attachCorrelationId(request, supabaseResponse);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return attachCorrelationId(request, NextResponse.redirect(url));
  }

  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = supabaseEnv;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    const pathname = request.nextUrl.pathname;
    const isPublicRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/health");

    if (isPublicRoute) {
      return attachCorrelationId(request, supabaseResponse);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return attachCorrelationId(request, NextResponse.redirect(url));
  }

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/health");

  const isApiRoute = pathname.startsWith("/api/");

  if (!user && !isPublicRoute) {
    if (isApiRoute) {
      return attachCorrelationId(request, supabaseResponse);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return attachCorrelationId(request, NextResponse.redirect(url));
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return attachCorrelationId(request, NextResponse.redirect(url));
  }

  return attachCorrelationId(request, supabaseResponse);
}
