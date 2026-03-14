import { randomUUID } from "crypto";
import { getCurrentOrganizationContext, listMyOrganizationContexts } from "@/lib/auth";
import { listMyWorkspaceMemberships } from "@/lib/db/workspaces";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrganizationPlanCode } from "@/lib/auth";

export type OrganizationMemberRecord = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
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

export type OrganizationWorkspaceStatus = {
  organizationId: string;
  organizationName: string;
  planCode: OrganizationPlanCode;
  planLabel: string;
  maxWorkspaces: number | null;
  activeWorkspacesCount: number;
  canCreateMoreWorkspaces: boolean;
};

export type OrganizationMemberAccess = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationRole: "owner" | "member";
  workspaceRole: "admin" | "manager" | "member";
  canManageInvitations: boolean;
  canViewPendingInvitations: boolean;
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

type BillingTrialClaimRecord = {
  user_id: string;
  email: string;
  first_subscription_started_at: string;
  trial_consumed_at: string | null;
};

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

async function getBillingTrialClaim(params: { userId: string; email: string | null | undefined }) {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = params.email?.trim().toLowerCase() ?? null;
  const { data: directClaim, error: directClaimError } = await admin
    .from("billing_trial_claims")
    .select("user_id, email, first_subscription_started_at, trial_consumed_at")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (directClaimError) {
    throw new Error(directClaimError.message);
  }

  if (directClaim) {
    return directClaim as BillingTrialClaimRecord;
  }

  if (!normalizedEmail) {
    return null;
  }

  const { data: emailClaim, error: emailClaimError } = await admin
    .from("billing_trial_claims")
    .select("user_id, email, first_subscription_started_at, trial_consumed_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emailClaimError) {
    throw new Error(emailClaimError.message);
  }

  return (emailClaim as BillingTrialClaimRecord | null) ?? null;
}

export async function getMyBillingEligibility(): Promise<BillingEligibility> {
  const { user } = await requireAuthenticatedUser();
  const trialClaim = await getBillingTrialClaim({
    userId: user.id,
    email: user.email
  });

  if (trialClaim?.first_subscription_started_at) {
    return {
      isEligibleForTrial: false,
      hasStartedSubscriptionBefore: true
    };
  }

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

export async function listMyOrganizations() {
  return listMyOrganizationContexts();
}

export async function getCurrentOrganization() {
  return getCurrentOrganizationContext();
}

export async function getOrganizationMemberAccess(organizationId: string): Promise<OrganizationMemberAccess | null> {
  const [organizations, workspaceMemberships] = await Promise.all([
    listMyOrganizationContexts(),
    listMyWorkspaceMemberships()
  ]);

  const organization = organizations.find((item) => item.organizationId === organizationId);

  if (!organization) {
    return null;
  }

  const workspaceRole =
    organization.role === "owner"
      ? "admin"
      : workspaceMemberships.find(
          (membership) =>
            membership.organization_id === organizationId && (membership.role === "manager" || membership.role === "admin")
        )?.role ??
        workspaceMemberships.find((membership) => membership.organization_id === organizationId)?.role ??
        "member";

  const canManageInvitations = organization.role === "owner" || workspaceRole === "manager";

  return {
    userId: organization.userId,
    email: organization.email,
    organizationId: organization.organizationId,
    organizationName: organization.organizationName,
    organizationRole: organization.role,
    workspaceRole,
    canManageInvitations,
    canViewPendingInvitations: canManageInvitations
  };
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
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
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

export async function getOrganizationWorkspaceStatus(organizationId: string): Promise<OrganizationWorkspaceStatus> {
  const admin = createAdminSupabaseClient();
  const [{ data: organization, error: organizationError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
    admin
      .from("billing_subscriptions")
      .select("plan_code")
      .eq("organization_id", organizationId)
      .in("status", ["active", "trialing"])
      .maybeSingle()
  ]);

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found");
  }

  if (subscriptionError || !subscription) {
    throw new Error(subscriptionError?.message ?? "Plan information not found for organization");
  }

  const [{ data: limits, error: limitsError }, { data: usage, error: usageError }] = await Promise.all([
    admin.from("plan_limits").select("max_workspaces").eq("plan_code", subscription.plan_code).maybeSingle(),
    admin.from("organization_usage").select("active_workspaces_count").eq("organization_id", organizationId).maybeSingle()
  ]);

  if (limitsError) {
    throw new Error(limitsError.message);
  }

  if (usageError) {
    throw new Error(usageError.message);
  }

  const maxWorkspaces = limits?.max_workspaces ?? null;
  const activeWorkspacesCount = Number(usage?.active_workspaces_count ?? 0);

  return {
    organizationId,
    organizationName: organization.name,
    planCode: subscription.plan_code,
    planLabel: getPlanLabel(subscription.plan_code),
    maxWorkspaces,
    activeWorkspacesCount,
    canCreateMoreWorkspaces: maxWorkspaces === null ? true : activeWorkspacesCount < maxWorkspaces
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
