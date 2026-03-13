import type { Route } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getMyOrganizationSetupDraft } from "@/lib/db/organizations";
import { OrganizationSetupNameStep } from "@/features/organization/organization-setup-name-step";

export default async function OrganizationSetupPage({
  searchParams
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/organization/setup" as Route);
  }

  const organization = await getCurrentOrganization();

  if (organization) {
    redirect("/dashboard" as Route);
  }

  const draft = await getMyOrganizationSetupDraft();

  if (draft && edit !== "1") {
    redirect("/organization/setup/plan" as Route);
  }

  return <OrganizationSetupNameStep draft={draft} userEmail={user.email ?? ""} />;
}
