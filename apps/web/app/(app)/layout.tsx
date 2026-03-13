import type { Route } from "next";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/auth/authenticated-shell";
import { getCurrentOrganization, getOrganizationWorkspaceStatus, listMyOrganizations } from "@/lib/db/organizations";
import { listMyWorkspaceMemberships } from "@/lib/db/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [organization, organizations, memberships] = await Promise.all([
    getCurrentOrganization(),
    listMyOrganizations(),
    listMyWorkspaceMemberships()
  ]);

  if (!organization || organizations.length === 0) {
    redirect("/organization/setup" as Route);
  }

  const workspaceStatus = await getOrganizationWorkspaceStatus(organization.organizationId);

  return (
    <AuthenticatedShell
      memberships={memberships}
      userEmail={user.email ?? ""}
      currentOrganization={organization}
      organizations={organizations}
      workspaceStatus={workspaceStatus}
    >
      {children}
    </AuthenticatedShell>
  );
}
