import { redirect } from "next/navigation";
import {
  getCurrentOrganization,
  getOrganizationMemberAccess,
  getOrganizationSeatStatus,
  listOrganizationInvitations,
  listOrganizationMembers
} from "@/lib/db/organizations";
import { OrganizationMembersPanel } from "@/features/organization/organization-members-panel";

export default async function OrganizationMembersPage() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    redirect("/workspace");
  }

  const access = await getOrganizationMemberAccess(organization.organizationId);

  const [members, invitations, seatStatus] = await Promise.all([
    listOrganizationMembers(organization.organizationId),
    access?.canViewPendingInvitations ? listOrganizationInvitations(organization.organizationId) : Promise.resolve([]),
    access?.canManageInvitations ? getOrganizationSeatStatus(organization.organizationId) : Promise.resolve(null)
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <OrganizationMembersPanel
        organization={organization}
        members={members}
        invitations={invitations}
        seatStatus={seatStatus}
        canManageInvitations={access?.canManageInvitations ?? false}
      />
    </main>
  );
}
