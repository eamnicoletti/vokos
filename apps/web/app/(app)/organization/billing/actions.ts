"use server";

import { z } from "zod";
import { requireManageableOrganizationBillingSummary } from "@/lib/db/billing";
import { createOrganizationBillingPortalSession } from "@/lib/billing/stripe";

const openBillingPortalSchema = z.object({
  organizationId: z.string().uuid(),
  returnPath: z.string().min(1),
  intent: z.enum(["manage", "upgrade"]).default("manage")
});

export async function openOrganizationBillingPortalAction(rawInput: unknown) {
  const input = openBillingPortalSchema.parse(rawInput);
  const organization = await requireManageableOrganizationBillingSummary(input.organizationId);

  if (!organization.stripeCustomerId) {
    throw new Error("Cliente Stripe ainda nao encontrado para esta organizacao");
  }

  return createOrganizationBillingPortalSession({
    stripeCustomerId: organization.stripeCustomerId,
    returnPath: input.returnPath,
    flow:
      input.intent === "upgrade" && organization.stripeSubscriptionId
        ? {
            type: "subscription_update",
            stripeSubscriptionId: organization.stripeSubscriptionId
          }
        : undefined
  });
}
