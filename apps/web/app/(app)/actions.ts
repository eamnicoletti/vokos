"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createWorkspaceSchema = z.object({
  name: z.string().min(3).max(120)
});

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createWorkspaceAction(rawInput: unknown) {
  const input = createWorkspaceSchema.parse(rawInput);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const slug = `${toSlug(input.name)}-${randomUUID().slice(0, 8)}`;

  const { data: workspaceId, error: bootstrapError } = await supabase.rpc("bootstrap_m1_workspace", {
    p_user_id: user.id,
    p_workspace_name: input.name,
    p_workspace_slug: slug
  });

  if (bootstrapError || !workspaceId) {
    throw new Error(bootstrapError?.message ?? "Workspace bootstrap failed");
  }

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("is_default", true)
    .maybeSingle();

  if (boardError || !board) {
    throw new Error(boardError?.message ?? "Default board not found after workspace bootstrap");
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      workspace_id: workspaceId,
      workspace_role: "admin"
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  const { error: auditError } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    entity_type: "workspace",
    entity_id: workspaceId,
    action: "workspace_create",
    actor_type: "human",
    actor_user_id: user.id,
    diff_json: { name: input.name }
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  revalidatePath("/workspace");

  return { workspaceId, boardId: board.id };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
