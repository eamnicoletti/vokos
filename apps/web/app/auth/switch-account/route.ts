import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const email = requestUrl.searchParams.get("email");
  const target = new URL("/login", requestUrl.origin);

  target.searchParams.set("next", nextPath);
  if (email) {
    target.searchParams.set("email", email);
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Best effort: even if sign-out fails, continue to login so the user can retry.
  }

  return NextResponse.redirect(target);
}
