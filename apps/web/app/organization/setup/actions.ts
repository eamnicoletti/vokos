"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createOrganizationCheckoutSession } from "@/lib/billing/stripe";
import { getMyBillingEligibility, saveMyOrganizationSetupDraft } from "@/lib/db/organizations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const organizationSetupSchema = z.object({
  organizationName: z.string().min(3).max(120),
  planCode: z.enum(["essencial", "equipe", "enterprise"]).default("equipe")
});

export async function saveOrganizationSetupDraftAction(rawInput: unknown) {
  const input = organizationSetupSchema.parse(rawInput);
  const draft = await saveMyOrganizationSetupDraft(input);

  revalidatePath("/organization/setup");
  revalidatePath("/organization/setup/plan");
  return draft;
}

export async function startOrganizationCheckoutAction(rawInput: unknown) {
  const input = organizationSetupSchema.parse(rawInput);
  const draft = await saveMyOrganizationSetupDraft(input);
  const billingEligibility = await getMyBillingEligibility();

  if (!draft) {
    throw new Error("Organization draft not found");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const result = await createOrganizationCheckoutSession({
    organizationId: draft.organizationId,
    organizationName: draft.organizationName,
    planCode: draft.planCode,
    userEmail: user.email ?? "",
    trialPeriodDays: billingEligibility.isEligibleForTrial ? 30 : 0
  });

  revalidatePath("/organization/setup");
  revalidatePath("/organization/setup/plan");
  revalidatePath("/", "layout");
  return result;
}
