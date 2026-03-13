import type { Route } from "next";
import { redirect } from "next/navigation";
import { OrganizationSetupConfirmStep } from "@/features/organization/organization-setup-confirm-step";
import { getCurrentOrganization, getMyOrganizationSetupDraft } from "@/lib/db/organizations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OrganizationSetupConfirmPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/organization/setup/confirm" as Route);
  }

  const organization = await getCurrentOrganization();

  if (organization) {
    redirect("/dashboard" as Route);
  }

  const draft = await getMyOrganizationSetupDraft();

  if (!draft) {
    redirect("/organization/setup" as Route);
  }

  return <OrganizationSetupConfirmStep organizationName={draft.organizationName} userEmail={user.email ?? ""} />;
}
