import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  buildInvitationAcceptUrl,
  createInvitationToken,
  hashInvitationToken,
  invitationCooldownRemainingMs,
  invitationExpiresAt,
  isInvitationExpired,
  normalizeEmail
} from "@/lib/invitations";
import {
  getOrganizationDefaultBoardId,
  getOrganizationInvitationByTokenHash,
  getOrganizationSeatStatus
} from "@/lib/db/organizations";
import { sendOrganizationInvitationEmail } from "@/lib/server/resend";

type CreateInvitationParams = {
  organizationId: string;
  email: string;
  invitedByUserId: string;
};

type ManageInvitationParams = {
  organizationId: string;
  invitationId: string;
  actorUserId: string;
};

export class OrganizationUserLimitError extends Error {
  constructor(
    public readonly organizationName: string,
    public readonly planLabel: string,
    public readonly maxUsers: number,
    public readonly activeUsersCount: number
  ) {
    super(
      `Não é possível adicionar mais membros porque a organização "${organizationName}" está no plano "${planLabel}", que permite até ${maxUsers} membro(s).`
    );
    this.name = "OrganizationUserLimitError";
  }
}

async function writeInvitationAuditEvent(params: {
  organizationId: string;
  invitationId: string;
  actorUserId: string;
  action: string;
  diffJson: Record<string, unknown>;
}) {
  const workspaceId = await getOrganizationDefaultBoardWorkspaceId(params.organizationId);
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    entity_type: "organization_invitation",
    entity_id: params.invitationId,
    action: params.action,
    actor_type: "human",
    actor_user_id: params.actorUserId,
    diff_json: params.diffJson
  });

  if (error) {
    throw new Error(`Audit insert failed: ${error.message}`);
  }
}

async function getOrganizationDefaultBoardWorkspaceId(organizationId: string): Promise<string> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Workspace not found for organization");
  }

  return data.id;
}

async function getOrganizationName(organizationId: string): Promise<string> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Organization not found");
  }

  return data.name;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("find_user_id_by_email", {
    p_email: normalizeEmail(email)
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function getInvitationRecord(organizationId: string, invitationId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("organization_invitations")
    .select("id, email, status, expires_at, last_sent_at, resend_count")
    .eq("organization_id", organizationId)
    .eq("id", invitationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Invitation not found");
  }

  return data;
}

async function assertOrganizationHasSeatAvailable(organizationId: string) {
  const seatStatus = await getOrganizationSeatStatus(organizationId);

  if (!seatStatus.canInviteMoreUsers && seatStatus.maxUsers !== null) {
    throw new OrganizationUserLimitError(
      seatStatus.organizationName,
      seatStatus.planLabel,
      seatStatus.maxUsers,
      seatStatus.activeUsersCount
    );
  }

  return seatStatus;
}

export async function createOrganizationInvitation(params: CreateInvitationParams) {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const email = normalizeEmail(params.email);

  if (!email) {
    throw new Error("E-mail inválido");
  }

  if (email === normalizeEmail(email) && email.length < 5) {
    throw new Error("E-mail inválido");
  }

  const existingUserId = await findUserIdByEmail(email);
  if (existingUserId) {
    const { data: membership, error: membershipError } = await admin
      .from("organization_members")
      .select("user_id, is_active")
      .eq("organization_id", params.organizationId)
      .eq("user_id", existingUserId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (membership?.is_active) {
      throw new Error("Esse usuário já faz parte da organização");
    }
  }

  const { data: pendingInvitation, error: pendingError } = await admin
    .from("organization_invitations")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  if (pendingInvitation) {
    throw new Error("Já existe um convite pendente para esse e-mail");
  }

  await assertOrganizationHasSeatAvailable(params.organizationId);

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = invitationExpiresAt();
  const inviteLink = buildInvitationAcceptUrl(token);

  const { data: invitation, error: insertError } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: params.organizationId,
      email,
      invited_by_user_id: params.invitedByUserId,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      last_sent_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (insertError || !invitation) {
    throw new Error(insertError?.message ?? "Failed to create invitation");
  }

  await writeInvitationAuditEvent({
    organizationId: params.organizationId,
    invitationId: invitation.id,
    actorUserId: params.invitedByUserId,
    action: "member_invite_create",
    diffJson: { email, expires_at: expiresAt }
  });

  const organizationName = await getOrganizationName(params.organizationId);
  const delivery = await sendOrganizationInvitationEmail({
    to: email,
    organizationName,
    inviteLink,
    expiresAt
  });

  return {
    invitationId: invitation.id,
    email,
    inviteLink,
    expiresAt,
    deliveryError: delivery.ok ? null : delivery.error
  };
}

export async function resendOrganizationInvitation(params: ManageInvitationParams) {
  const supabase = await createServerSupabaseClient();
  const record = await getInvitationRecord(params.organizationId, params.invitationId);

  if (record.status === "accepted") {
    throw new Error("Não é possível reenviar um convite já aceito");
  }

  if (record.status === "revoked") {
    throw new Error("Não é possível reenviar um convite revogado");
  }

  const cooldownRemaining = invitationCooldownRemainingMs(record.last_sent_at);
  if (cooldownRemaining > 0) {
    throw new Error("Aguarde um minuto antes de reenviar este convite");
  }

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = invitationExpiresAt();
  const inviteLink = buildInvitationAcceptUrl(token);

  const { error } = await supabase
    .from("organization_invitations")
    .update({
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      last_sent_at: new Date().toISOString(),
      resend_count: (record.resend_count ?? 0) + 1,
      revoked_at: null,
      revoked_by_user_id: null
    })
    .eq("organization_id", params.organizationId)
    .eq("id", params.invitationId);

  if (error) {
    throw new Error(error.message);
  }

  await writeInvitationAuditEvent({
    organizationId: params.organizationId,
    invitationId: params.invitationId,
    actorUserId: params.actorUserId,
    action: "member_invite_resend",
    diffJson: { email: record.email, resend_count: (record.resend_count ?? 0) + 1, expires_at: expiresAt }
  });

  const organizationName = await getOrganizationName(params.organizationId);
  const delivery = await sendOrganizationInvitationEmail({
    to: record.email,
    organizationName,
    inviteLink,
    expiresAt
  });

  return {
    invitationId: params.invitationId,
    email: record.email,
    inviteLink,
    expiresAt,
    deliveryError: delivery.ok ? null : delivery.error
  };
}

export async function revokeOrganizationInvitation(params: ManageInvitationParams) {
  const supabase = await createServerSupabaseClient();
  const record = await getInvitationRecord(params.organizationId, params.invitationId);

  if (record.status === "accepted") {
    throw new Error("Não é possível revogar um convite já aceito");
  }

  if (record.status === "revoked") {
    return { invitationId: record.id, email: record.email };
  }

  const { error } = await supabase
    .from("organization_invitations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: params.actorUserId
    })
    .eq("organization_id", params.organizationId)
    .eq("id", params.invitationId);

  if (error) {
    throw new Error(error.message);
  }

  await writeInvitationAuditEvent({
    organizationId: params.organizationId,
    invitationId: params.invitationId,
    actorUserId: params.actorUserId,
    action: "member_invite_revoke",
    diffJson: { email: record.email }
  });

  return { invitationId: record.id, email: record.email };
}

export async function replaceOrganizationInvitationEmail(params: ManageInvitationParams & { email: string }) {
  const record = await getInvitationRecord(params.organizationId, params.invitationId);

  if (record.status === "accepted") {
    throw new Error("Não é possível corrigir um convite já aceito");
  }

  await revokeOrganizationInvitation(params);

  return createOrganizationInvitation({
    organizationId: params.organizationId,
    email: params.email,
    invitedByUserId: params.actorUserId
  });
}

export async function markOrganizationInvitationExpiredById(organizationId: string, invitationId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("organization_invitations")
    .update({ status: "expired" })
    .eq("organization_id", organizationId)
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptOrganizationInvitationToken(params: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = normalizeEmail(params.userEmail);
  const invitation = await getOrganizationInvitationByTokenHash(hashInvitationToken(params.token));

  if (!invitation) {
    throw new Error("Convite inválido");
  }

  if (invitation.status === "revoked") {
    throw new Error("Este convite foi revogado");
  }

  if (invitation.status === "accepted") {
    if (invitation.acceptedUserId && invitation.acceptedUserId !== params.userId) {
      throw new Error("Este convite já foi usado por outra conta");
    }

    const boardId = await getOrganizationDefaultBoardId(invitation.organizationId);
    return {
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      boardId
    };
  }

  if (isInvitationExpired(invitation.expiresAt)) {
    await markOrganizationInvitationExpiredById(invitation.organizationId, invitation.id);
    throw new Error("Este convite expirou");
  }

  if (normalizeEmail(invitation.email) !== normalizedEmail) {
    throw new Error("Você precisa entrar com o mesmo e-mail que recebeu o convite");
  }

  await assertOrganizationHasSeatAvailable(invitation.organizationId);

  const { error: upsertError } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: invitation.organizationId,
        user_id: params.userId,
        role: "member",
        is_active: true
      },
      {
        onConflict: "organization_id,user_id"
      }
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: invitationError } = await admin
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_user_id: params.userId
    })
    .eq("id", invitation.id)
    .eq("organization_id", invitation.organizationId)
    .eq("status", "pending");

  if (invitationError) {
    throw new Error(invitationError.message);
  }

  const supabase = await createServerSupabaseClient();
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      active_organization_id: invitation.organizationId
    }
  });

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  await writeInvitationAuditEvent({
    organizationId: invitation.organizationId,
    invitationId: invitation.id,
    actorUserId: params.userId,
    action: "member_invite_accept",
    diffJson: { email: normalizedEmail }
  });

  const boardId = await getOrganizationDefaultBoardId(invitation.organizationId);

  return {
    organizationId: invitation.organizationId,
    organizationName: invitation.organizationName,
    boardId
  };
}
