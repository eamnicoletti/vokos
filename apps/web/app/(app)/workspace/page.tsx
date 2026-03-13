import { CalendarClock, FolderKanban } from "lucide-react";
import { getCurrentOrganization, getOrganizationWorkspaceStatus } from "@/lib/db/organizations";
import { listMyWorkspaceMemberships, listWorkspaceTaskOverview } from "@/lib/db/workspaces";
import { WorkspaceTaskPanel } from "@/features/workspaces/workspace-task-panel";
import { WorkspaceBootstrap } from "@/features/workspaces/workspace-bootstrap";
import { MembershipWelcomeDialog } from "@/features/organization/membership-welcome-dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ welcomeOrganization?: string; boardId?: string }>;
}) {
  const { welcomeOrganization, boardId } = await searchParams;
  const memberships = await listMyWorkspaceMemberships();
  const hasWorkspaces = memberships.length > 0;

  if (!hasWorkspaces) {
    const organization = await getCurrentOrganization();

    if (!organization) {
      return null;
    }

    const workspaceStatus = await getOrganizationWorkspaceStatus(organization.organizationId);

    return (
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <WorkspaceBootstrap organizationId={organization.organizationId} workspaceStatus={workspaceStatus} />
      </main>
    );
  }

  const overview = await listWorkspaceTaskOverview(memberships);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      {welcomeOrganization ? (
        <MembershipWelcomeDialog organizationName={welcomeOrganization} boardId={boardId} />
      ) : null}
      <WorkspaceTaskPanel overview={overview} />
    </main>
  );
}
