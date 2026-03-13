function assertRequiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Define it in apps/web/.env.local (recommended) or apps/web/.env and restart dev server.`
    );
  }
  return value;
}

export function getSupabasePublicEnv() {
  // Use static property access so Next can inline NEXT_PUBLIC_* into client bundles.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    supabaseUrl: assertRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    supabaseAnonKey: assertRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey)
  };
}

export function getSupabaseServiceRoleKey(): string {
  return assertRequiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getOptionalResendEnv() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL
  };
}
