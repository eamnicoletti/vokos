import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserProfilesByIds } from "@/lib/server/user-profiles";
import { requireAuthContext } from "@/lib/auth";
import type { UserProfileSummary } from "@/lib/user-profile";

export type BoardSnapshot = {
  id: string;
  name: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  lists: Array<{
    id: string;
    name: string;
    position: number;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      priority: "low" | "medium" | "high" | "urgent" | null;
      source_type: "manual" | "email" | "dje" | "portal";
      assignee_user_id: string | null;
      assignee: UserProfileSummary | null;
      edited_count: number;
    }>;
  }>;
};

export const getBoardSnapshot = cache(async (boardId: string): Promise<BoardSnapshot | null> => {
  await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, name, workspace_id, workspace:workspaces(name, slug)")
    .eq("id", boardId)
    .maybeSingle();

  if (!board) {
    return null;
  }

  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select("id, name, position")
    .eq("board_id", boardId)
    .eq("workspace_id", board.workspace_id)
    .order("position", { ascending: true });

  if (listsError || !lists) {
    throw new Error(listsError?.message ?? "Unable to load lists");
  }

  const listIds = lists.map((list) => list.id);
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, priority, source_type, assignee_user_id, edited_count, list_id, position")
    .in("list_id", listIds.length > 0 ? listIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("workspace_id", board.workspace_id)
    .order("position", { ascending: true });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const assigneeProfiles = await getUserProfilesByIds((tasks ?? []).map((task) => task.assignee_user_id));

  const byList = new Map<string, BoardSnapshot["lists"][number]["tasks"]>();
  for (const list of lists) {
    byList.set(list.id, []);
  }

  for (const task of tasks ?? []) {
    const bucket = byList.get(task.list_id);
    if (bucket) {
      bucket.push({
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        source_type: task.source_type,
        assignee_user_id: task.assignee_user_id,
        assignee: task.assignee_user_id ? assigneeProfiles.get(task.assignee_user_id) ?? null : null,
        edited_count: task.edited_count
      });
    }
  }

  const workspaceRaw = Array.isArray(board.workspace) ? board.workspace[0] : board.workspace;
  if (!workspaceRaw) {
    throw new Error("Workspace not found for board");
  }

  return {
    id: board.id,
    name: board.name,
    workspace: {
      id: board.workspace_id,
      name: workspaceRaw.name,
      slug: workspaceRaw.slug
    },
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      position: list.position,
      tasks: byList.get(list.id) ?? []
    }))
  };
});
