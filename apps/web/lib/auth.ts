import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: "admin" | "manager" | "member";
};

export type OrganizationRole = "owner" | "member";
export type OrganizationPlanCode = "essencial" | "equipe" | "enterprise";

export type OrganizationContext = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  planCode: OrganizationPlanCode;
  planLabel: string;
  role: OrganizationRole;
};

function mapOrganizationRole(role: "owner" | "member"): AuthContext["role"] {
  return role === "owner" ? "admin" : "member";
}

function planLabel(planCode: OrganizationPlanCode) {
  if (planCode === "essencial") return "Essencial";
  if (planCode === "equipe") return "Equipe";
  return "Enterprise";
}

async function requireUser() {
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

export async function listMyOrganizationContexts(): Promise<OrganizationContext[]> {
  const { supabase, user } = await requireUser();

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organization:organizations(name, slug, status)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const organizationIds = (memberships ?? []).map((membership) => membership.organization_id);

  if (organizationIds.length === 0) {
    return [];
  }

  const admin = createAdminSupabaseClient();
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("billing_subscriptions")
    .select("organization_id, plan_code, status")
    .in("organization_id", organizationIds)
    .in("status", ["active", "trialing"]);

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message);
  }

  const activeSubscriptionByOrganization = new Map<
    string,
    {
      planCode: OrganizationPlanCode;
    }
  >();

  for (const subscription of subscriptions ?? []) {
    activeSubscriptionByOrganization.set(subscription.organization_id, {
      planCode: subscription.plan_code
    });
  }

  return (memberships ?? [])
    .map((membership) => {
      const organization = Array.isArray(membership.organization)
        ? membership.organization[0]
        : membership.organization;
      const activeSubscription = activeSubscriptionByOrganization.get(membership.organization_id);

      if (!organization || organization.status !== "active" || !activeSubscription) {
        return null;
      }

      return {
        userId: user.id,
        email: user.email ?? "",
        organizationId: membership.organization_id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        planCode: activeSubscription.planCode,
        planLabel: planLabel(activeSubscription.planCode),
        role: membership.role
      };
    })
    .filter((membership): membership is OrganizationContext => membership !== null);
}

export async function getCurrentOrganizationContext(): Promise<OrganizationContext | null> {
  const memberships = await listMyOrganizationContexts();
  if (memberships.length === 0) {
    return null;
  }

  const { user } = await requireUser();
  const activeOrganizationId = user.user_metadata.active_organization_id as string | undefined;

  return memberships.find((membership) => membership.organizationId === activeOrganizationId) ?? memberships[0];
}

export async function requireOrganizationOwnerContext(organizationId?: string): Promise<OrganizationContext> {
  const memberships = await listMyOrganizationContexts();

  const targetMembership =
    (organizationId
      ? memberships.find((membership) => membership.organizationId === organizationId)
      : await getCurrentOrganizationContext()) ?? null;

  if (!targetMembership) {
    throw new Error("Organization membership not found");
  }

  if (targetMembership.role !== "owner") {
    throw new Error("Only organization owners can perform this action");
  }

  return targetMembership;
}

export async function requireAuthContext(): Promise<AuthContext> {
  const { supabase, user } = await requireUser();
  const organizations = await listMyOrganizationContexts();

  if (organizations.length === 0) {
    throw new Error("Organization membership not found");
  }

  const organizationById = new Map(organizations.map((organization) => [organization.organizationId, organization]));
  const preferredOrganizationId = (user.user_metadata.active_organization_id as string | undefined) ?? organizations[0]?.organizationId;
  const preferredOrganization = organizationById.get(preferredOrganizationId) ?? organizations[0];
  const workspaceId = user.user_metadata.workspace_id as string | undefined;

  if (workspaceId) {
    const { data: metadataWorkspace, error: metadataWorkspaceError } = await supabase
      .from("workspaces")
      .select("id, organization_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (metadataWorkspaceError) {
      throw new Error(metadataWorkspaceError.message);
    }

    if (metadataWorkspace && organizationById.has(metadataWorkspace.organization_id)) {
      return {
        userId: user.id,
        workspaceId: metadataWorkspace.id,
        role: mapOrganizationRole(organizationById.get(metadataWorkspace.organization_id)?.role ?? "member")
      };
    }
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, organization_id")
    .eq("organization_id", preferredOrganization.organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "Workspace not found");
  }

  return {
    userId: user.id,
    workspaceId: workspace.id,
    role: mapOrganizationRole(preferredOrganization.role)
  };
}
