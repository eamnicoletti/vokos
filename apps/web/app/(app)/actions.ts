"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentOrganizationContext, listMyOrganizationContexts } from "@/lib/auth";
import { getOrganizationWorkspaceStatus } from "@/lib/db/organizations";
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

  if (organization.role !== "owner") {
    throw new Error("Apenas administradores da organização podem criar workspaces.");
  }

  const workspaceStatus = await getOrganizationWorkspaceStatus(organization.organizationId);

  if (!workspaceStatus.canCreateMoreWorkspaces) {
    const maxWorkspacesLabel = workspaceStatus.maxWorkspaces === 1 ? "1 workspace" : `${workspaceStatus.maxWorkspaces} workspaces`;
    throw new Error(
      `Não é possível criar outro workspace porque a organização "${workspaceStatus.organizationName}" está no plano "${workspaceStatus.planLabel}" e esse plano permite até ${maxWorkspacesLabel}.`
    );
  }

  const slug = `${toSlug(input.name)}-${randomUUID().slice(0, 8)}`;
  const { data: createdWorkspace, error: workspaceError } = await supabase.rpc(
    "bootstrap_m1_workspace_for_organization",
    {
      p_user_id: user.id,
      p_organization_id: organization.organizationId,
      p_workspace_name: input.name,
      p_workspace_slug: slug
    }
  );

  if (workspaceError || !createdWorkspace) {
    throw new Error(workspaceError?.message ?? "Falha ao criar workspace");
  }

  const payload =
    typeof createdWorkspace === "string" ? (JSON.parse(createdWorkspace) as { workspace_id?: string; board_id?: string }) : createdWorkspace;
  const workspaceId = typeof payload === "object" && payload !== null && "workspace_id" in payload ? payload.workspace_id : null;
  const boardId = typeof payload === "object" && payload !== null && "board_id" in payload ? payload.board_id : null;

  if (!workspaceId || !boardId) {
    throw new Error("Falha ao inicializar o workspace criado.");
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      active_organization_id: organization.organizationId,
      workspace_id: workspaceId,
      workspace_role: organization.role === "owner" ? "admin" : "member"
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  const { error: auditError } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    organization_id: organization.organizationId,
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
  revalidatePath("/", "layout");

  return { workspaceId, boardId };
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
