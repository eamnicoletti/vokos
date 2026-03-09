import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WorkspaceMembership = {
  workspace_id: string;
  role: "admin" | "manager" | "member";
  default_board_id: string | null;
  workspace: {
    name: string;
    slug: string;
  };
};

export type WorkspaceTaskOverview = {
  workspaceId: string;
  workspaceName: string;
  defaultBoardId: string | null;
  statuses: Array<{
    id: string;
    name: string;
    position: number;
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
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspace:workspaces(name, slug)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch memberships");
  }

  const workspaceIds = data.map((row) => row.workspace_id);
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

  const memberships: WorkspaceMembership[] = [];

  for (const row of data) {
    const workspaceRaw = Array.isArray(row.workspace) ? row.workspace[0] : row.workspace;
    if (!workspaceRaw) {
      continue;
    }

    memberships.push({
      workspace_id: row.workspace_id,
      role: row.role,
      workspace: {
        name: workspaceRaw.name,
        slug: workspaceRaw.slug
      },
      default_board_id: defaultBoardByWorkspace.get(row.workspace_id) ?? null
    });
  }

  return memberships;
}

export async function listWorkspaceTaskOverview(memberships: WorkspaceMembership[]): Promise<WorkspaceTaskOverview[]> {
  if (memberships.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const workspaceIds = memberships.map((membership) => membership.workspace_id);

  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select("id, workspace_id, name, position")
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
