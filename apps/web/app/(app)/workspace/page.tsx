import { CalendarClock, FolderKanban } from "lucide-react";
import { listMyWorkspaceMemberships, listWorkspaceTaskOverview } from "@/lib/db/workspaces";
import { WorkspaceTaskPanel } from "@/features/workspaces/workspace-task-panel";
import { WorkspaceBootstrap } from "@/features/workspaces/workspace-bootstrap";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkspacePage() {
  const memberships = await listMyWorkspaceMemberships();
  const hasWorkspaces = memberships.length > 0;

  if (!hasWorkspaces) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <WorkspaceBootstrap />
      </main>
    );
  }

  const overview = await listWorkspaceTaskOverview(memberships);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <WorkspaceTaskPanel overview={overview} />
    </main>
  );
}
