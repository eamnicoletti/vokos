"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ActorType = "human" | "bot" | "system";

const createTaskInputSchema = z.object({
  boardId: z.string().uuid(),
  listId: z.string().uuid(),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional()
});

const moveTaskInputSchema = z.object({
  boardId: z.string().uuid(),
  taskId: z.string().uuid(),
  targetListId: z.string().uuid(),
  position: z.number().min(0)
});

const addCommentInputSchema = z.object({
  boardId: z.string().uuid(),
  taskId: z.string().uuid(),
  body: z.string().min(1).max(2000)
});

const updateTaskInputSchema = z.object({
  boardId: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string().min(3).max(180).optional(),
  description: z.string().max(4000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).nullable().optional()
});

const updateListInputSchema = z.object({
  boardId: z.string().uuid(),
  listId: z.string().uuid(),
  name: z.string().min(3).max(120)
});

async function writeAuditEvent(params: {
  workspaceId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: ActorType;
  actorUserId: string;
  diffJson: Record<string, unknown>;
}) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("audit_events").insert({
    workspace_id: params.workspaceId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    actor_type: params.actorType,
    actor_user_id: params.actorUserId,
    diff_json: params.diffJson
  });

  if (error) {
    throw new Error(`Audit insert failed: ${error.message}`);
  }
}

export async function createTaskAction(rawInput: unknown) {
  const input = createTaskInputSchema.parse(rawInput);
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, project_id, workspace_id")
    .eq("id", input.boardId)
    .maybeSingle();

  if (!board) {
    throw new Error("Board not found");
  }

  const { data: list } = await supabase
    .from("lists")
    .select("id")
    .eq("id", input.listId)
    .eq("board_id", input.boardId)
    .eq("workspace_id", board.workspace_id)
    .maybeSingle();

  if (!list) {
    throw new Error("List not found for this board");
  }

  const { data: insertedTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      workspace_id: board.workspace_id,
      project_id: board.project_id,
      board_id: input.boardId,
      list_id: input.listId,
      title: input.title,
      description: input.description ?? null,
      created_by_type: "human",
      created_by_user_id: auth.userId,
      source_type: "manual",
      edited_count: 0,
      position: 1000
    })
    .select("id")
    .single();

  if (insertError || !insertedTask) {
    throw new Error(insertError?.message ?? "Task creation failed");
  }

  await writeAuditEvent({
    workspaceId: board.workspace_id,
    entityType: "task",
    entityId: insertedTask.id,
    action: "task_create",
    actorType: "human",
    actorUserId: auth.userId,
    diffJson: {
      title: input.title,
      list_id: input.listId
    }
  });

  revalidatePath(`/boards/${input.boardId}`);
}

export async function moveTaskAction(rawInput: unknown) {
  const input = moveTaskInputSchema.parse(rawInput);
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: previousTask, error: fetchError } = await supabase
    .from("tasks")
    .select("id, board_id, workspace_id, list_id, edited_count")
    .eq("id", input.taskId)
    .eq("board_id", input.boardId)
    .single();

  if (fetchError || !previousTask) {
    throw new Error(fetchError?.message ?? "Task not found");
  }

  const { data: targetList, error: targetListError } = await supabase
    .from("lists")
    .select("id")
    .eq("id", input.targetListId)
    .eq("board_id", input.boardId)
    .eq("workspace_id", previousTask.workspace_id)
    .maybeSingle();

  if (targetListError || !targetList) {
    throw new Error(targetListError?.message ?? "Target list not found");
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      list_id: input.targetListId,
      position: input.position,
      edited_count: (previousTask.edited_count ?? 0) + 1,
      last_edited_at: new Date().toISOString(),
      last_edited_by_user_id: auth.userId
    })
    .eq("id", input.taskId)
    .eq("workspace_id", previousTask.workspace_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await writeAuditEvent({
    workspaceId: previousTask.workspace_id,
    entityType: "task",
    entityId: input.taskId,
    action: "task_move",
    actorType: "human",
    actorUserId: auth.userId,
    diffJson: {
      from_list_id: previousTask.list_id,
      to_list_id: input.targetListId,
      position: input.position
    }
  });

  revalidatePath(`/boards/${input.boardId}`);
}

export async function addTaskCommentAction(rawInput: unknown) {
  const input = addCommentInputSchema.parse(rawInput);
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, workspace_id")
    .eq("id", input.taskId)
    .eq("board_id", input.boardId)
    .single();

  if (taskError || !task) {
    throw new Error(taskError?.message ?? "Task not found");
  }

  const { data: insertedComment, error: insertError } = await supabase
    .from("task_comments")
    .insert({
      workspace_id: task.workspace_id,
      task_id: input.taskId,
      author_user_id: auth.userId,
      body: input.body
    })
    .select("id")
    .single();

  if (insertError || !insertedComment) {
    throw new Error(insertError?.message ?? "Comment creation failed");
  }

  await writeAuditEvent({
    workspaceId: task.workspace_id,
    entityType: "task_comment",
    entityId: insertedComment.id,
    action: "task_comment_create",
    actorType: "human",
    actorUserId: auth.userId,
    diffJson: {
      task_id: input.taskId
    }
  });

  revalidatePath(`/boards/${input.boardId}`);
}

export async function updateTaskAction(rawInput: unknown) {
  const input = updateTaskInputSchema.parse(rawInput);
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: previousTask, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, priority, workspace_id, edited_count")
    .eq("id", input.taskId)
    .eq("board_id", input.boardId)
    .single();

  if (fetchError || !previousTask) {
    throw new Error(fetchError?.message ?? "Task not found");
  }

  const nextTitle = input.title?.trim() || previousTask.title;
  const nextDescription =
    input.description === undefined ? previousTask.description : input.description.trim() ? input.description : null;
  const nextDueDate = input.dueDate === undefined ? previousTask.due_date : input.dueDate;
  const nextPriority = input.priority === undefined ? previousTask.priority : input.priority;

  const updatePayload: Record<string, unknown> = {
    title: nextTitle,
    description: nextDescription,
    due_date: nextDueDate,
    priority: nextPriority,
    edited_count: (previousTask.edited_count ?? 0) + 1,
    last_edited_at: new Date().toISOString(),
    last_edited_by_user_id: auth.userId
  };

  const { error: updateError } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", input.taskId)
    .eq("workspace_id", previousTask.workspace_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await writeAuditEvent({
    workspaceId: previousTask.workspace_id,
    entityType: "task",
    entityId: input.taskId,
    action: "task_update",
    actorType: "human",
    actorUserId: auth.userId,
    diffJson: {
      from: {
        title: previousTask.title,
        description: previousTask.description,
        due_date: previousTask.due_date,
        priority: previousTask.priority
      },
      to: {
        title: nextTitle,
        description: nextDescription,
        due_date: nextDueDate,
        priority: nextPriority
      }
    }
  });

  revalidatePath(`/boards/${input.boardId}`);
}

export async function updateListNameAction(rawInput: unknown) {
  const input = updateListInputSchema.parse(rawInput);
  const auth = await requireAuthContext();
  const supabase = await createServerSupabaseClient();

  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id, name, workspace_id")
    .eq("id", input.listId)
    .eq("board_id", input.boardId)
    .maybeSingle();

  if (listError || !list) {
    throw new Error(listError?.message ?? "List not found");
  }

  const { error: updateError } = await supabase
    .from("lists")
    .update({ name: input.name })
    .eq("id", input.listId)
    .eq("workspace_id", list.workspace_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await writeAuditEvent({
    workspaceId: list.workspace_id,
    entityType: "list",
    entityId: input.listId,
    action: "list_rename",
    actorType: "human",
    actorUserId: auth.userId,
    diffJson: {
      from: { name: list.name },
      to: { name: input.name }
    }
  });

  revalidatePath(`/boards/${input.boardId}`);
}
