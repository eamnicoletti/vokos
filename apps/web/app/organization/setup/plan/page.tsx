import type { Route } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getMyBillingEligibility, getMyOrganizationSetupDraft } from "@/lib/db/organizations";
import { OrganizationSetupPlanStep } from "@/features/organization/organization-setup-plan-step";

export default async function OrganizationSetupPlanPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/organization/setup/plan" as Route);
  }

  const organization = await getCurrentOrganization();

  if (organization) {
    redirect("/dashboard" as Route);
  }

  const [draft, billingEligibility] = await Promise.all([getMyOrganizationSetupDraft(), getMyBillingEligibility()]);

  if (!draft) {
    redirect("/organization/setup" as Route);
  }

  return (
    <OrganizationSetupPlanStep
      draft={draft}
      userEmail={user.email ?? ""}
      isEligibleForTrial={billingEligibility.isEligibleForTrial}
    />
  );
}
