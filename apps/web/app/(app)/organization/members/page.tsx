import { redirect } from "next/navigation";
import { getCurrentOrganization, getOrganizationSeatStatus, listOrganizationInvitations, listOrganizationMembers } from "@/lib/db/organizations";
import { OrganizationMembersPanel } from "@/features/organization/organization-members-panel";

export default async function OrganizationMembersPage() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    redirect("/workspace");
  }

  const [members, invitations, seatStatus] = await Promise.all([
    listOrganizationMembers(organization.organizationId),
    listOrganizationInvitations(organization.organizationId),
    getOrganizationSeatStatus(organization.organizationId)
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <OrganizationMembersPanel organization={organization} members={members} invitations={invitations} seatStatus={seatStatus} />
    </main>
  );
}
