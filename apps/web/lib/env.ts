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

export function getOptionalStripeEnv() {
  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    essentialPriceId: process.env.STRIPE_PRICE_ESSENCIAL,
    teamPriceId: process.env.STRIPE_PRICE_EQUIPE,
    enterprisePriceId: process.env.STRIPE_PRICE_ENTERPRISE
  };
}

export function getStripeSecretKey(): string {
  return assertRequiredEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
}

export function getStripeWebhookSecret(): string {
  return assertRequiredEnv("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
}

export function isStripeCheckoutConfigured() {
  const stripe = getOptionalStripeEnv();

  return Boolean(
    stripe.publishableKey &&
      stripe.secretKey &&
      stripe.essentialPriceId &&
      stripe.teamPriceId &&
      stripe.enterprisePriceId
  );
}

export function isStripeWebhookConfigured() {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function isStripeBillingConfigured() {
  return isStripeCheckoutConfigured() && isStripeWebhookConfigured();
}
