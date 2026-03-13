import type Stripe from "stripe";
import { getCurrentOrganizationContext, requireOrganizationOwnerContext } from "@/lib/auth";
import type { OrganizationPlanCode } from "@/lib/auth";
import { APP_PLANS } from "@/lib/plans";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listStripeInvoicesByCustomers } from "@/lib/billing/stripe";

export type BillingInvoiceSummary = {
  invoiceId: string;
  organizationId: string;
  organizationName: string;
  amountPaidInCents: number;
  amountDueInCents: number;
  currency: string;
  status: string | null;
  createdAt: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  invoiceNumber: string | null;
};

export type OrganizationBillingSummary = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: "owner" | "member";
  canManage: boolean;
  planCode: OrganizationPlanCode;
  planLabel: string;
  monthlyPriceInCents: number;
  priceLabel: string;
  subscriptionStatus: "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  stripeCustomerId: string | null;
};

export type AccountBillingOverview = {
  organizations: OrganizationBillingSummary[];
  invoices: BillingInvoiceSummary[];
  totalMonthlySpendInCents: number;
};

type BillingSubscriptionRow = {
  organization_id: string;
  plan_code: OrganizationPlanCode;
  status: OrganizationBillingSummary["subscriptionStatus"];
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
};

function getPlanDefinition(planCode: OrganizationPlanCode) {
  return APP_PLANS.find((plan) => plan.code === planCode) ?? APP_PLANS[1];
}

async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { user };
}

function mapInvoiceToSummary(params: {
  invoice: Stripe.Invoice;
  organizationId: string;
  organizationName: string;
}): BillingInvoiceSummary {
  return {
    invoiceId: params.invoice.id,
    organizationId: params.organizationId,
    organizationName: params.organizationName,
    amountPaidInCents: params.invoice.amount_paid,
    amountDueInCents: params.invoice.amount_due,
    currency: params.invoice.currency.toUpperCase(),
    status: params.invoice.status,
    createdAt: new Date(params.invoice.created * 1000).toISOString(),
    hostedInvoiceUrl: params.invoice.hosted_invoice_url ?? null,
    invoicePdfUrl: params.invoice.invoice_pdf ?? null,
    invoiceNumber: params.invoice.number
  };
}

async function listOwnedOrganizationsBillingRows(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data: organizations, error: organizationsError } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true });

  if (organizationsError) {
    throw new Error(organizationsError.message);
  }

  if (!organizations || organizations.length === 0) {
    return [];
  }

  const organizationIds = organizations.map((organization) => organization.id);
  const [{ data: subscriptions, error: subscriptionsError }, { data: customers, error: customersError }] = await Promise.all([
    admin
      .from("billing_subscriptions")
      .select("organization_id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at")
      .in("organization_id", organizationIds),
    admin
      .from("billing_customers")
      .select("organization_id, stripe_customer_id")
      .in("organization_id", organizationIds)
  ]);

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message);
  }

  if (customersError) {
    throw new Error(customersError.message);
  }

  const subscriptionByOrganization = new Map(
    (subscriptions ?? []).map((subscription) => [subscription.organization_id, subscription as BillingSubscriptionRow])
  );
  const customerByOrganization = new Map(
    (customers ?? []).map((customer) => [customer.organization_id, customer.stripe_customer_id as string | null])
  );

  const summaries: OrganizationBillingSummary[] = [];

  for (const organization of organizations) {
    const subscription = subscriptionByOrganization.get(organization.id);

    if (!subscription) {
      continue;
    }

    const plan = getPlanDefinition(subscription.plan_code);
    summaries.push({
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      role: "owner",
      canManage: true,
      planCode: subscription.plan_code,
      planLabel: plan.label,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      priceLabel: plan.priceLabel,
      subscriptionStatus: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      canceledAt: subscription.canceled_at,
      stripeCustomerId: customerByOrganization.get(organization.id) ?? null
    });
  }

  return summaries;
}

async function getOwnedOrganizationBillingSummaryById(userId: string, organizationId: string) {
  const organizations = await listOwnedOrganizationsBillingRows(userId);
  return organizations.find((organization) => organization.organizationId === organizationId) ?? null;
}

export async function getCurrentOrganizationBillingSummary(): Promise<OrganizationBillingSummary | null> {
  const organization = await getCurrentOrganizationContext();

  if (!organization) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const [{ data: subscription, error: subscriptionError }, { data: customer, error: customerError }] = await Promise.all([
    admin
      .from("billing_subscriptions")
      .select("organization_id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at")
      .eq("organization_id", organization.organizationId)
      .maybeSingle(),
    admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("organization_id", organization.organizationId)
      .maybeSingle()
  ]);

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!subscription) {
    return null;
  }

  const plan = getPlanDefinition(subscription.plan_code);

  return {
    organizationId: organization.organizationId,
    organizationName: organization.organizationName,
    organizationSlug: organization.organizationSlug,
    role: organization.role,
    canManage: organization.role === "owner",
    planCode: subscription.plan_code,
    planLabel: plan.label,
    monthlyPriceInCents: plan.monthlyPriceInCents,
    priceLabel: plan.priceLabel,
    subscriptionStatus: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    canceledAt: subscription.canceled_at,
    stripeCustomerId: customer?.stripe_customer_id ?? null
  };
}

export async function getMyAccountBillingOverview(): Promise<AccountBillingOverview> {
  const { user } = await requireAuthenticatedUser();
  const organizations = await listOwnedOrganizationsBillingRows(user.id);
  const customerMap = organizations
    .filter((organization) => organization.stripeCustomerId)
    .map((organization) => ({
      organizationId: organization.organizationId,
      organizationName: organization.organizationName,
      stripeCustomerId: organization.stripeCustomerId as string
    }));

  const invoices = await listStripeInvoicesByCustomers(customerMap, 6);
  const summarizedInvoices = invoices
    .map((invoice) => {
      const customer = customerMap.find((item) => item.stripeCustomerId === invoice.customerId);
      if (!customer) {
        return null;
      }

      return mapInvoiceToSummary({
        invoice: invoice.invoice,
        organizationId: customer.organizationId,
        organizationName: customer.organizationName
      });
    })
    .filter((invoice): invoice is BillingInvoiceSummary => invoice !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  const totalMonthlySpendInCents = organizations
    .filter((organization) => ["trialing", "active", "past_due"].includes(organization.subscriptionStatus))
    .reduce((sum, organization) => sum + organization.monthlyPriceInCents, 0);

  return {
    organizations,
    invoices: summarizedInvoices,
    totalMonthlySpendInCents
  };
}

export async function requireManageableOrganizationBillingSummary(organizationId: string) {
  const organization = await requireOrganizationOwnerContext(organizationId);
  const summary = await getOwnedOrganizationBillingSummaryById(organization.userId, organization.organizationId);

  if (!summary) {
    throw new Error("Assinatura nao encontrada para esta organizacao");
  }

  return summary;
}
