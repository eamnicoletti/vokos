import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/env";

function getProjectRefFromUrl(supabaseUrl: string) {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function shouldClearAuthCookies(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; status?: number };
  return (
    candidate.code === "refresh_token_not_found" ||
    candidate.code === "invalid_refresh_token" ||
    (candidate.status === 400 && candidate.code === "refresh_token_not_found")
  );
}

function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest, projectRef: string | null) {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const prefixes = projectRef ? [`sb-${projectRef}-`] : [];

  for (const cookieName of cookieNames) {
    const isProjectCookie = prefixes.some((prefix) => cookieName.startsWith(prefix));
    const isLegacyCookie = cookieName === "supabase-auth-token" || cookieName.startsWith("supabase-auth-token.");

    if (!isProjectCookie && !isLegacyCookie) {
      continue;
    }

    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0
    });
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/stripe/webhook") {
    return NextResponse.next();
  }

  const env = getSupabasePublicEnv();
  const projectRef = getProjectRefFromUrl(env.supabaseUrl);
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value);
        }

        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      }
    }
  });

  try {
    const { error } = await supabase.auth.getUser();
    if (shouldClearAuthCookies(error)) {
      clearSupabaseAuthCookies(response, request, projectRef);
    }
  } catch (error) {
    if (shouldClearAuthCookies(error)) {
      clearSupabaseAuthCookies(response, request, projectRef);
    } else {
      throw error;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
