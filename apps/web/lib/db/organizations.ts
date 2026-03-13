import { randomUUID } from "crypto";
import { getCurrentOrganizationContext, listMyOrganizationContexts } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrganizationPlanCode } from "@/lib/auth";

export type OrganizationMemberRecord = {
  userId: string;
  email: string;
  fullName: string;
  role: "owner" | "member";
  isActive: boolean;
  invitedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationInvitationRecord = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  effectiveStatus: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  lastSentAt: string;
  resendCount: number;
  invitedByUserId: string;
  invitedByEmail: string;
  invitedByName: string;
  acceptedAt: string | null;
  acceptedUserId: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationInvitationLookup = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  acceptedUserId: string | null;
};

export type OrganizationSeatStatus = {
  organizationId: string;
  organizationName: string;
  planCode: OrganizationPlanCode;
  planLabel: string;
  maxUsers: number | null;
  activeUsersCount: number;
  canInviteMoreUsers: boolean;
};

export type OrganizationSetupDraft = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: "active" | "inactive" | "past_due" | "canceled";
  planCode: OrganizationPlanCode;
  planLabel: string;
  subscriptionStatus: "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  workspaceId: string | null;
  defaultBoardId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BillingEligibility = {
  isEligibleForTrial: boolean;
  hasStartedSubscriptionBefore: boolean;
};

const DEFAULT_BOARD_NAME = "Board Principal";
const DEFAULT_LISTS = ["Inbox Juridico", "Em andamento", "Revisao", "Concluido"] as const;

export function getPlanLabel(planCode: OrganizationPlanCode) {
  if (planCode === "essencial") return "Essencial";
  if (planCode === "equipe") return "Equipe";
  return "Enterprise";
}

function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

async function ensureUniqueSlug(table: "organizations" | "workspaces", name: string, currentId?: string | null) {
  const admin = createAdminSupabaseClient();
  const baseSlug = toSlug(name) || table.slice(0, -1);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 6)}`;
    const { data, error } = await admin.from(table).select("id").eq("slug", candidate).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === currentId) {
      return candidate;
    }
  }

  throw new Error(`Unable to reserve a unique slug for ${table}`);
}

async function listOwnedOrganizationsWithBilling(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data: organizations, error: organizationsError } = await admin
    .from("organizations")
    .select("id, name, slug, status, created_at, updated_at")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });

  if (organizationsError) {
    throw new Error(organizationsError.message);
  }

  if (!organizations || organizations.length === 0) {
    return [];
  }

  const organizationIds = organizations.map((organization) => organization.id);

  const [{ data: subscriptions, error: subscriptionsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    admin
      .from("billing_subscriptions")
      .select("organization_id, plan_code, status")
      .in("organization_id", organizationIds),
    admin
      .from("organization_members")
      .select("organization_id, is_active, role")
      .eq("user_id", userId)
      .in("organization_id", organizationIds)
  ]);

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message);
  }

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const subscriptionByOrganization = new Map(
    (subscriptions ?? []).map((subscription) => [subscription.organization_id, subscription])
  );
  const membershipByOrganization = new Map((memberships ?? []).map((membership) => [membership.organization_id, membership]));

  return organizations.map((organization) => ({
    ...organization,
    subscription: subscriptionByOrganization.get(organization.id) ?? null,
    membership: membershipByOrganization.get(organization.id) ?? null
  }));
}

export async function getMyBillingEligibility(): Promise<BillingEligibility> {
  const { user } = await requireAuthenticatedUser();
  const organizations = await listOwnedOrganizationsWithBilling(user.id);

  const hasStartedSubscriptionBefore = organizations.some(
    (organization) => organization.subscription && organization.subscription.status !== "incomplete"
  );

  return {
    isEligibleForTrial: !hasStartedSubscriptionBefore,
    hasStartedSubscriptionBefore
  };
}

async function findMyOrganizationDraftRecord(userId: string) {
  const organizations = await listOwnedOrganizationsWithBilling(userId);

  return (
    organizations.find(
      (organization) =>
        organization.status !== "active" ||
        !organization.subscription ||
        !["active", "trialing"].includes(organization.subscription.status) ||
        organization.membership?.is_active !== true
    ) ?? null
  );
}

async function ensureOrganizationWorkspace(params: {
  organizationId: string;
  organizationName: string;
  ownerUserId: string;
}) {
  const admin = createAdminSupabaseClient();
  let { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .eq("organization_id", params.organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  if (!workspace) {
    const workspaceSlug = await ensureUniqueSlug("workspaces", params.organizationName);
    const { data: createdWorkspace, error: createWorkspaceError } = await admin
      .from("workspaces")
      .insert({
        name: params.organizationName,
        slug: workspaceSlug,
        owner_user_id: params.ownerUserId,
        organization_id: params.organizationId
      })
      .select("id, name, slug")
      .single();

    if (createWorkspaceError || !createdWorkspace) {
      throw new Error(createWorkspaceError?.message ?? "Failed to create workspace");
    }

    workspace = createdWorkspace;
  }

  let { data: board, error: boardError } = await admin
    .from("boards")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("workspace_id", workspace.id)
    .eq("is_default", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (!board) {
    const { data: createdBoard, error: createBoardError } = await admin
      .from("boards")
      .insert({
        workspace_id: workspace.id,
        organization_id: params.organizationId,
        name: DEFAULT_BOARD_NAME,
        is_default: true,
        created_by_user_id: params.ownerUserId
      })
      .select("id")
      .single();

    if (createBoardError || !createdBoard) {
      throw new Error(createBoardError?.message ?? "Failed to create default board");
    }

    board = createdBoard;
  }

  const { data: existingLists, error: listsError } = await admin
    .from("lists")
    .select("name")
    .eq("organization_id", params.organizationId)
    .eq("workspace_id", workspace.id)
    .eq("board_id", board.id);

  if (listsError) {
    throw new Error(listsError.message);
  }

  const existingListNames = new Set((existingLists ?? []).map((list) => list.name));
  const missingLists = DEFAULT_LISTS.filter((name) => !existingListNames.has(name));

  if (missingLists.length > 0) {
    const { error: insertListsError } = await admin.from("lists").insert(
      DEFAULT_LISTS.filter((name) => !existingListNames.has(name)).map((name) => ({
        workspace_id: workspace.id,
        organization_id: params.organizationId,
        board_id: board.id,
        name,
        position: (DEFAULT_LISTS.indexOf(name) + 1) * 100
      }))
    );

    if (insertListsError) {
      throw new Error(insertListsError.message);
    }
  }

  return {
    workspaceId: workspace.id,
    boardId: board.id
  };
}

export async function listMyOrganizations() {
  return listMyOrganizationContexts();
}

export async function getCurrentOrganization() {
  return getCurrentOrganizationContext();
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMemberRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("list_organization_members", {
    p_organization_id: organizationId
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    invitedByUserId: row.invited_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })) as OrganizationMemberRecord[];
}

export async function listOrganizationInvitations(organizationId: string): Promise<OrganizationInvitationRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("list_organization_invitations", {
    p_organization_id: organizationId
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    effectiveStatus: row.effective_status,
    expiresAt: row.expires_at,
    lastSentAt: row.last_sent_at,
    resendCount: row.resend_count,
    invitedByUserId: row.invited_by_user_id,
    invitedByEmail: row.invited_by_email,
    invitedByName: row.invited_by_name,
    acceptedAt: row.accepted_at,
    acceptedUserId: row.accepted_user_id,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })) as OrganizationInvitationRecord[];
}

export async function getOrganizationInvitationByTokenHash(tokenHash: string): Promise<OrganizationInvitationLookup | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("organization_invitations")
    .select("id, organization_id, email, status, expires_at, accepted_user_id, organization:organizations(name, slug)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const organization = Array.isArray(data.organization) ? data.organization[0] : data.organization;
  if (!organization) {
    throw new Error("Organization not found for invitation");
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    email: data.email,
    status: data.status,
    expiresAt: data.expires_at,
    acceptedUserId: data.accepted_user_id
  };
}

export async function getOrganizationDefaultBoardId(organizationId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("boards")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function getOrganizationSeatStatus(organizationId: string): Promise<OrganizationSeatStatus> {
  const admin = createAdminSupabaseClient();
  const [{ data: organization, error: organizationError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
    admin.from("billing_subscriptions").select("plan_code").eq("organization_id", organizationId).maybeSingle()
  ]);

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found");
  }

  if (subscriptionError || !subscription) {
    throw new Error(subscriptionError?.message ?? "Plan information not found for organization");
  }

  const [{ data: limits, error: limitsError }, { data: usage, error: usageError }] = await Promise.all([
    admin.from("plan_limits").select("max_users").eq("plan_code", subscription.plan_code).maybeSingle(),
    admin.from("organization_usage").select("active_users_count").eq("organization_id", organizationId).maybeSingle()
  ]);

  if (limitsError) {
    throw new Error(limitsError.message);
  }

  if (usageError) {
    throw new Error(usageError.message);
  }

  const maxUsers = limits?.max_users ?? null;
  const activeUsersCount = Number(usage?.active_users_count ?? 0);

  return {
    organizationId,
    organizationName: organization.name,
    planCode: subscription.plan_code,
    planLabel: getPlanLabel(subscription.plan_code),
    maxUsers,
    activeUsersCount,
    canInviteMoreUsers: maxUsers === null ? true : activeUsersCount < maxUsers
  };
}

export async function getMyOrganizationSetupDraft(): Promise<OrganizationSetupDraft | null> {
  const { user } = await requireAuthenticatedUser();
  const draft = await findMyOrganizationDraftRecord(user.id);

  if (!draft || !draft.subscription) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id")
    .eq("organization_id", draft.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  const defaultBoardId = workspace?.id ? await getOrganizationDefaultBoardId(draft.id) : null;

  return {
    organizationId: draft.id,
    organizationName: draft.name,
    organizationSlug: draft.slug,
    organizationStatus: draft.status,
    planCode: draft.subscription.plan_code,
    planLabel: getPlanLabel(draft.subscription.plan_code),
    subscriptionStatus: draft.subscription.status,
    workspaceId: workspace?.id ?? null,
    defaultBoardId,
    createdAt: draft.created_at,
    updatedAt: draft.updated_at
  };
}

export async function saveMyOrganizationSetupDraft(input: {
  organizationName: string;
  planCode: OrganizationPlanCode;
}) {
  const { user } = await requireAuthenticatedUser();
  const admin = createAdminSupabaseClient();
  const organizationName = input.organizationName.trim();

  if (organizationName.length < 3) {
    throw new Error("Informe um nome de organizacao com pelo menos 3 caracteres");
  }

  const existingDraft = await findMyOrganizationDraftRecord(user.id);
  const organizationSlug = await ensureUniqueSlug("organizations", organizationName, existingDraft?.id ?? null);

  let organizationId = existingDraft?.id ?? null;

  if (!existingDraft) {
    const { data: createdOrganization, error: createOrganizationError } = await admin
      .from("organizations")
      .insert({
        name: organizationName,
        slug: organizationSlug,
        owner_user_id: user.id,
        status: "inactive"
      })
      .select("id")
      .single();

    if (createOrganizationError || !createdOrganization) {
      throw new Error(createOrganizationError?.message ?? "Failed to create organization");
    }

    organizationId = createdOrganization.id;
  } else {
    const { error: updateOrganizationError } = await admin
      .from("organizations")
      .update({
        name: organizationName,
        slug: organizationSlug,
        status: "inactive"
      })
      .eq("id", existingDraft.id);

    if (updateOrganizationError) {
      throw new Error(updateOrganizationError.message);
    }

    organizationId = existingDraft.id;
  }

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: user.id,
      role: "owner",
      is_active: false
    },
    {
      onConflict: "organization_id,user_id"
    }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { error: subscriptionError } = await admin.from("billing_subscriptions").upsert(
    {
      organization_id: organizationId,
      plan_code: input.planCode,
      status: "incomplete",
      metadata: {
        provider: "mock",
        source: "organization_setup_draft"
      }
    },
    {
      onConflict: "organization_id"
    }
  );

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  return getMyOrganizationSetupDraft();
}

export async function activateMyOrganizationSubscription(input: {
  organizationName: string;
  planCode: OrganizationPlanCode;
}) {
  const draft = await saveMyOrganizationSetupDraft(input);

  if (!draft) {
    throw new Error("Organization draft not found");
  }

  const { supabase, user } = await requireAuthenticatedUser();
  const billingEligibility = await getMyBillingEligibility();
  const admin = createAdminSupabaseClient();
  const now = new Date();
  const currentPeriodStart = now.toISOString();
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const nextSubscriptionStatus = billingEligibility.isEligibleForTrial ? "trialing" : "active";
  const { error: subscriptionError } = await admin.from("billing_subscriptions").upsert(
    {
      organization_id: draft.organizationId,
      plan_code: input.planCode,
      status: nextSubscriptionStatus,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: {
        provider: "mock",
        source: "organization_setup_activation",
        activated_at: currentPeriodStart,
        trial_started_at: billingEligibility.isEligibleForTrial ? currentPeriodStart : null
      }
    },
    {
      onConflict: "organization_id"
    }
  );

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  const { error: organizationError } = await admin
    .from("organizations")
    .update({
      name: input.organizationName.trim(),
      status: "active"
    })
    .eq("id", draft.organizationId);

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: draft.organizationId,
      user_id: user.id,
      role: "owner",
      is_active: true
    },
    {
      onConflict: "organization_id,user_id"
    }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      active_organization_id: draft.organizationId,
      workspace_id: null,
      workspace_role: null
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  return {
    organizationId: draft.organizationId,
    workspaceId: null,
    boardId: null,
    subscriptionStatus: nextSubscriptionStatus
  };
}
