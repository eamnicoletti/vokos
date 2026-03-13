"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentOrganizationContext, listMyOrganizationContexts } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createWorkspaceSchema = z.object({
  name: z.string().min(3).max(120)
});

const setActiveOrganizationSchema = z.object({
  organizationId: z.string().uuid()
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

  const organization = await getCurrentOrganizationContext();

  if (!organization) {
    throw new Error("Active organization not found");
  }

  const slug = `${toSlug(input.name)}-${randomUUID().slice(0, 8)}`;
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: input.name,
      slug,
      owner_user_id: user.id,
      organization_id: organization.organizationId
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "Workspace creation failed");
  }

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspace.id,
      organization_id: organization.organizationId,
      name: "Board Principal",
      is_default: true,
      created_by_user_id: user.id
    })
    .select("id")
    .single();

  if (boardError || !board) {
    throw new Error(boardError?.message ?? "Default board creation failed");
  }

  const { error: listsError } = await supabase.from("lists").insert([
    {
      workspace_id: workspace.id,
      organization_id: organization.organizationId,
      board_id: board.id,
      name: "Inbox Juridico",
      position: 100
    },
    {
      workspace_id: workspace.id,
      organization_id: organization.organizationId,
      board_id: board.id,
      name: "Em andamento",
      position: 200
    },
    {
      workspace_id: workspace.id,
      organization_id: organization.organizationId,
      board_id: board.id,
      name: "Revisao",
      position: 300
    },
    {
      workspace_id: workspace.id,
      organization_id: organization.organizationId,
      board_id: board.id,
      name: "Concluido",
      position: 400
    }
  ]);

  if (listsError) {
    throw new Error(listsError.message);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      active_organization_id: organization.organizationId,
      workspace_id: workspace.id,
      workspace_role: organization.role === "owner" ? "admin" : "member"
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  const { error: auditError } = await supabase.from("audit_events").insert({
    workspace_id: workspace.id,
    organization_id: organization.organizationId,
    entity_type: "workspace",
    entity_id: workspace.id,
    action: "workspace_create",
    actor_type: "human",
    actor_user_id: user.id,
    diff_json: { name: input.name }
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  revalidatePath("/workspace");

  return { workspaceId: workspace.id, boardId: board.id };
}

export async function setActiveOrganizationAction(rawInput: unknown) {
  const input = setActiveOrganizationSchema.parse(rawInput);
  const organizations = await listMyOrganizationContexts();
  const targetOrganization = organizations.find((organization) => organization.organizationId === input.organizationId);

  if (!targetOrganization) {
    throw new Error("Organizacao nao encontrada");
  }

  const supabase = await createServerSupabaseClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "Workspace not found for organization");
  }

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("workspace_id", workspace.id)
    .eq("is_default", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (boardError) {
    throw new Error(boardError.message);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      active_organization_id: input.organizationId,
      workspace_id: workspace.id,
      workspace_role: targetOrganization.role === "owner" ? "admin" : "member"
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  revalidatePath("/", "layout");

  return {
    boardId: board?.id ?? null
  };
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
