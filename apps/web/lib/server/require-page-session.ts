import type { User } from "@supabase/supabase-js";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePageSession(nextPath: string): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect((`/login?next=${encodeURIComponent(nextPath)}`) as Route);
  }

  return user;
}
