"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const env = getSupabasePublicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
