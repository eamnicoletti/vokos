import { listMyOrganizationContexts } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WorkspaceMembership = {
  workspace_id: string;
  organization_id: string;
  role: "admin" | "manager" | "member";
  default_board_id: string | null;
  workspace: {
    name: string;
    slug: string;
  };
};

function mapOrganizationRole(role: "owner" | "member"): WorkspaceMembership["role"] {
  return role === "owner" ? "admin" : "member";
}

export type WorkspaceTaskOverview = {
  workspaceId: string;
  workspaceName: string;
  defaultBoardId: string | null;
  statuses: Array<{
    id: string;
    name: string;
    position: number;
    boardId: string;
    tasks: Array<{
      id: string;
      title: string;
      dueDate: string | null;
      priority: "low" | "medium" | "high" | "urgent" | null;
      sourceType: "manual" | "email" | "dje" | "portal";
      assigneeUserId: string | null;
      boardId: string;
    }>;
  }>;
};

export async function listMyWorkspaceMemberships(): Promise<WorkspaceMembership[]> {
  const supabase = await createServerSupabaseClient();
  const organizations = await listMyOrganizationContexts();

  if (organizations.length === 0) {
    return [];
  }

  const roleByOrganization = new Map<string, "owner" | "member">();
  for (const organization of organizations) {
    if (!roleByOrganization.has(organization.organizationId)) {
      roleByOrganization.set(organization.organizationId, organization.role);
    }
  }

  const organizationIds = organizations.map((organization) => organization.organizationId);

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id, organization_id, name, slug")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: true });

  if (workspacesError || !workspaces) {
    throw new Error(workspacesError?.message ?? "Failed to fetch workspaces");
  }

  const workspaceIds = workspaces.map((workspace) => workspace.id);
  const { data: boards, error: boardsError } = await supabase
    .from("boards")
    .select("id, workspace_id, is_default")
    .in("workspace_id", workspaceIds.length > 0 ? workspaceIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_default", true);

  if (boardsError) {
    throw new Error(boardsError.message);
  }

  const defaultBoardByWorkspace = new Map<string, string>();
  for (const board of boards ?? []) {
    defaultBoardByWorkspace.set(board.workspace_id, board.id);
  }

  return workspaces.map((workspace) => ({
    workspace_id: workspace.id,
    organization_id: workspace.organization_id,
    role: mapOrganizationRole(roleByOrganization.get(workspace.organization_id) ?? "member"),
    workspace: {
      name: workspace.name,
      slug: workspace.slug
    },
    default_board_id: defaultBoardByWorkspace.get(workspace.id) ?? null
  }));
}

export async function listWorkspaceTaskOverview(memberships: WorkspaceMembership[]): Promise<WorkspaceTaskOverview[]> {
  if (memberships.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const workspaceIds = memberships.map((membership) => membership.workspace_id);

  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select("id, workspace_id, board_id, name, position")
    .in("workspace_id", workspaceIds)
    .eq("is_archived", false)
    .order("position", { ascending: true });

  if (listsError) {
    throw new Error(listsError.message);
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, workspace_id, list_id, board_id, title, due_date, priority, source_type, assignee_user_id, created_at")
    .in("workspace_id", workspaceIds)
    .eq("is_archived", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const statusesByWorkspace = new Map<
    string,
    WorkspaceTaskOverview["statuses"]
  >();

  for (const list of lists ?? []) {
    const bucket = statusesByWorkspace.get(list.workspace_id) ?? [];
    bucket.push({
      id: list.id,
      name: list.name,
      position: list.position,
      boardId: list.board_id,
      tasks: []
    });
    statusesByWorkspace.set(list.workspace_id, bucket);
  }

  const statusByListId = new Map<string, WorkspaceTaskOverview["statuses"][number]>();
  for (const statusGroup of statusesByWorkspace.values()) {
    for (const status of statusGroup) {
      statusByListId.set(status.id, status);
    }
  }

  for (const task of tasks ?? []) {
    const status = statusByListId.get(task.list_id);
    if (!status) {
      continue;
    }

    status.tasks.push({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      priority: task.priority,
      sourceType: task.source_type,
      assigneeUserId: task.assignee_user_id,
      boardId: task.board_id
    });
  }

  return memberships.map((membership) => ({
    workspaceId: membership.workspace_id,
    workspaceName: membership.workspace.name,
    defaultBoardId: membership.default_board_id,
    statuses:
      statusesByWorkspace.get(membership.workspace_id)?.sort((a, b) => a.position - b.position) ?? []
  }));
}
