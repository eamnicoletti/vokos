import Stripe from "stripe";
import type { OrganizationPlanCode } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAppBaseUrl,
  getOptionalStripeEnv,
  getStripeSecretKey,
  getStripeWebhookSecret,
  isStripeCheckoutConfigured
} from "@/lib/env";

export type CreateOrganizationCheckoutParams = {
  organizationId: string;
  organizationName: string;
  planCode: OrganizationPlanCode;
  userEmail: string;
  trialPeriodDays: number;
};

export type OrganizationCheckoutSession = {
  checkoutUrl: string;
};

export type BillingPortalSession = {
  url: string;
};

export type StripeCustomerInvoiceBatch = {
  customerId: string;
  invoice: Stripe.Invoice;
};

type SubscriptionStatus = "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
type OrganizationStatus = "active" | "inactive" | "past_due" | "canceled";

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}

export async function createOrganizationBillingPortalSession(params: {
  stripeCustomerId: string;
  returnPath: string;
}): Promise<BillingPortalSession> {
  const stripe = getStripeClient();
  const appUrl = getAppBaseUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: `${appUrl}${params.returnPath}`,
    locale: "auto"
  });

  return {
    url: session.url
  };
}

export async function listStripeInvoicesByCustomers(
  customers: Array<{ stripeCustomerId: string }>,
  limitPerCustomer = 5
): Promise<StripeCustomerInvoiceBatch[]> {
  const stripe = getStripeClient();
  const invoiceBatches = await Promise.all(
    customers.map(async (customer) => {
      const invoices = await stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit: limitPerCustomer
      });

      return invoices.data.map((invoice) => ({
        customerId: customer.stripeCustomerId,
        invoice
      }));
    })
  );

  return invoiceBatches.flat();
}

export function getStripePriceId(planCode: OrganizationPlanCode): string | null {
  const stripe = getOptionalStripeEnv();

  if (planCode === "essencial") return stripe.essentialPriceId ?? null;
  if (planCode === "equipe") return stripe.teamPriceId ?? null;
  return stripe.enterprisePriceId ?? null;
}

function getPlanCodeFromPriceId(priceId: string | null | undefined): OrganizationPlanCode | null {
  const stripe = getOptionalStripeEnv();

  if (!priceId) {
    return null;
  }

  if (priceId === stripe.essentialPriceId) return "essencial";
  if (priceId === stripe.teamPriceId) return "equipe";
  if (priceId === stripe.enterprisePriceId) return "enterprise";
  return null;
}

function toIsoFromUnixTimestamp(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "unpaid") return "unpaid";
  return "incomplete";
}

function mapOrganizationStatus(subscriptionStatus: SubscriptionStatus): OrganizationStatus {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") return "active";
  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") return "past_due";
  if (subscriptionStatus === "canceled") return "canceled";
  return "inactive";
}

async function upsertBillingCustomer(params: { organizationId: string; stripeCustomerId: string }) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("billing_customers").upsert(
    {
      organization_id: params.organizationId,
      stripe_customer_id: params.stripeCustomerId,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "organization_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getOrCreateStripeCustomer(params: {
  organizationId: string;
  organizationName: string;
  userEmail: string;
}) {
  const stripe = getStripeClient();
  const admin = createAdminSupabaseClient();
  const { data: existingCustomer, error: customerError } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("organization_id", params.organizationId)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: params.userEmail,
    name: params.organizationName,
    metadata: {
      organization_id: params.organizationId
    }
  });

  await upsertBillingCustomer({
    organizationId: params.organizationId,
    stripeCustomerId: customer.id
  });

  return customer.id;
}

export async function createOrganizationCheckoutSession(
  params: CreateOrganizationCheckoutParams
): Promise<OrganizationCheckoutSession> {
  if (!isStripeCheckoutConfigured()) {
    throw new Error(
      "Stripe checkout ainda nao esta configurado. Defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY e os price IDs dos planos."
    );
  }

  const priceId = getStripePriceId(params.planCode);

  if (!priceId) {
    throw new Error(`Nao existe um Stripe price configurado para o plano ${params.planCode}.`);
  }

  const stripe = getStripeClient();
  const appUrl = getAppBaseUrl();
  const customerId = await getOrCreateStripeCustomer({
    organizationId: params.organizationId,
    organizationName: params.organizationName,
    userEmail: params.userEmail
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: params.organizationId,
    customer: customerId,
    success_url: `${appUrl}/organization/setup/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/organization/setup/plan?canceled=1`,
    allow_promotion_codes: true,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    metadata: {
      organization_id: params.organizationId,
      plan_code: params.planCode,
      owner_email: params.userEmail
    },
    subscription_data: {
      metadata: {
        organization_id: params.organizationId,
        plan_code: params.planCode,
        owner_email: params.userEmail
      },
      ...(params.trialPeriodDays > 0
        ? {
            trial_settings: {
              end_behavior: {
                missing_payment_method: "cancel"
              }
            },
            trial_period_days: params.trialPeriodDays
          }
        : {})
    }
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    checkoutUrl: session.url
  };
}

export function constructStripeEvent(payload: string, signature: string | null) {
  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  return getStripeClient().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
}

async function resolveOrganizationIdFromCustomer(customerId: string | null | undefined) {
  if (!customerId) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("billing_customers")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.organization_id ?? null;
}

async function resolveOrganizationOwnerUserId(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("organizations").select("owner_user_id").eq("id", organizationId).single();

  if (error || !data) {
    throw new Error(error?.message ?? "Organization not found");
  }

  return data.owner_user_id;
}

async function resolveOrganizationOwner(params: { organizationId: string }) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("organizations")
    .select("owner_user_id")
    .eq("id", params.organizationId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Organization not found");
  }

  const { data: ownerUser, error: ownerError } = await admin.auth.admin.getUserById(data.owner_user_id);

  if (ownerError || !ownerUser.user?.email) {
    throw new Error(ownerError?.message ?? "Organization owner email not found");
  }

  return {
    userId: data.owner_user_id,
    email: ownerUser.user.email
  };
}

async function syncOwnerMetadata(params: { ownerUserId: string; organizationId: string; allowAccess: boolean }) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.auth.admin.getUserById(params.ownerUserId);

  if (error || !data.user) {
    throw new Error(error?.message ?? "Owner user not found");
  }

  const currentMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;

  if (params.allowAccess) {
    const { error: updateError } = await admin.auth.admin.updateUserById(params.ownerUserId, {
      user_metadata: {
        ...currentMetadata,
        active_organization_id: params.organizationId
      }
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const nextMetadata = { ...currentMetadata };
  if (nextMetadata.active_organization_id === params.organizationId) {
    delete nextMetadata.active_organization_id;
    delete nextMetadata.workspace_id;
    delete nextMetadata.workspace_role;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(params.ownerUserId, {
    user_metadata: nextMetadata
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function syncOrganizationAccess(organizationId: string, subscriptionStatus: SubscriptionStatus) {
  const admin = createAdminSupabaseClient();
  const ownerUserId = await resolveOrganizationOwnerUserId(organizationId);
  const organizationStatus = mapOrganizationStatus(subscriptionStatus);
  const allowAccess = organizationStatus === "active";

  const { error: organizationError } = await admin
    .from("organizations")
    .update({
      status: organizationStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", organizationId);

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: ownerUserId,
      role: "owner",
      is_active: allowAccess,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "organization_id,user_id"
    }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  await syncOwnerMetadata({
    ownerUserId,
    organizationId,
    allowAccess
  });
}

async function recordBillingTrialClaim(params: {
  organizationId: string;
  stripeCustomerId: string | null;
  firstSubscriptionStartedAt: string;
  trialConsumedAt: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const owner = await resolveOrganizationOwner({
    organizationId: params.organizationId
  });
  const normalizedEmail = normalizeEmail(owner.email);
  const { data: existingClaim, error: existingClaimError } = await admin
    .from("billing_trial_claims")
    .select("user_id, email, first_subscription_started_at, first_subscription_organization_id, trial_consumed_at, stripe_customer_id")
    .or(`user_id.eq.${owner.userId},email.eq.${normalizedEmail}`)
    .order("first_subscription_started_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingClaimError) {
    throw new Error(existingClaimError.message);
  }

  const nextFirstSubscriptionStartedAt =
    existingClaim?.first_subscription_started_at &&
    existingClaim.first_subscription_started_at < params.firstSubscriptionStartedAt
      ? existingClaim.first_subscription_started_at
      : params.firstSubscriptionStartedAt;
  const nextTrialConsumedAt = existingClaim?.trial_consumed_at ?? params.trialConsumedAt;
  const nextStripeCustomerId = existingClaim?.stripe_customer_id ?? params.stripeCustomerId;

  const targetUserId = existingClaim?.user_id ?? owner.userId;
  const { error } = await admin.from("billing_trial_claims").upsert({
    user_id: targetUserId,
    email: normalizedEmail,
    first_subscription_started_at: nextFirstSubscriptionStartedAt,
    first_subscription_organization_id: existingClaim?.first_subscription_organization_id ?? params.organizationId,
    trial_consumed_at: nextTrialConsumedAt,
    stripe_customer_id: nextStripeCustomerId
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  context: {
    checkoutSessionId?: string | null;
    eventType: string;
  }
) {
  const admin = createAdminSupabaseClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const metadataOrganizationId = subscription.metadata.organization_id || null;
  const organizationId = metadataOrganizationId ?? (await resolveOrganizationIdFromCustomer(customerId));

  if (!organizationId) {
    throw new Error(`Could not resolve organization for Stripe subscription ${subscription.id}`);
  }

  if (customerId) {
    await upsertBillingCustomer({
      organizationId,
      stripeCustomerId: customerId
    });
  }

  const primaryPriceId = subscription.items.data[0]?.price?.id ?? null;
  const planCode =
    (subscription.metadata.plan_code as OrganizationPlanCode | undefined) ?? getPlanCodeFromPriceId(primaryPriceId);

  if (!planCode) {
    throw new Error(`Could not resolve plan code for Stripe subscription ${subscription.id}`);
  }

  const nextSubscriptionStatus = mapStripeSubscriptionStatus(subscription.status);
  const primaryItem = subscription.items.data[0];
  const firstSubscriptionStartedAt =
    toIsoFromUnixTimestamp(primaryItem?.current_period_start) ??
    toIsoFromUnixTimestamp(subscription.start_date) ??
    toIsoFromUnixTimestamp(subscription.created) ??
    new Date().toISOString();
  const trialConsumedAt =
    toIsoFromUnixTimestamp(subscription.trial_start) ??
    (nextSubscriptionStatus === "trialing" ? firstSubscriptionStartedAt : null);
  const { error: upsertError } = await admin.from("billing_subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: primaryPriceId,
      plan_code: planCode,
      status: nextSubscriptionStatus,
      current_period_start: toIsoFromUnixTimestamp(primaryItem?.current_period_start),
      current_period_end: toIsoFromUnixTimestamp(primaryItem?.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: toIsoFromUnixTimestamp(subscription.canceled_at),
      metadata: {
        provider: "stripe",
        checkout_session_id: context.checkoutSessionId ?? null,
        latest_event_type: context.eventType,
        stripe_customer_id: customerId ?? null
      },
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "organization_id"
    }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  if (nextSubscriptionStatus !== "incomplete") {
    await recordBillingTrialClaim({
      organizationId,
      stripeCustomerId: customerId ?? null,
      firstSubscriptionStartedAt,
      trialConsumedAt
    });
  }

  await syncOrganizationAccess(organizationId, nextSubscriptionStatus);

  return organizationId;
}

async function recordBillingEvent(params: {
  event: Stripe.Event;
  organizationId: string | null;
  error: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("billing_events").upsert(
    {
      stripe_event_id: params.event.id,
      organization_id: params.organizationId,
      type: params.event.type,
      payload: params.event as unknown as Record<string, unknown>,
      received_at: new Date(params.event.created * 1000).toISOString(),
      processed_at: params.error ? null : new Date().toISOString(),
      error: params.error
    },
    {
      onConflict: "stripe_event_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const organizationId = session.metadata?.organization_id ?? session.client_reference_id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!organizationId) {
    throw new Error(`Missing organization_id in checkout session ${session.id}`);
  }

  if (customerId) {
    await upsertBillingCustomer({
      organizationId,
      stripeCustomerId: customerId
    });
  }

  if (typeof session.subscription === "string") {
    const subscription = await getStripeClient().subscriptions.retrieve(session.subscription);
    await syncStripeSubscription(subscription, {
      checkoutSessionId: session.id,
      eventType: event.type
    });
  }

  return organizationId;
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  let organizationId: string | null = null;

  try {
    if (event.type === "checkout.session.completed") {
      organizationId = await handleCheckoutSessionCompleted(event);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      organizationId = await syncStripeSubscription(event.data.object as Stripe.Subscription, {
        eventType: event.type
      });
    }

    await recordBillingEvent({
      event,
      organizationId,
      error: null
    });
  } catch (error) {
    await recordBillingEvent({
      event,
      organizationId,
      error: error instanceof Error ? error.message : "Unknown Stripe webhook error"
    });
    throw error;
  }
}
