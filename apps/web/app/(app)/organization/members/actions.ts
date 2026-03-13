"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrganizationMemberAccess } from "@/lib/db/organizations";
import {
  createOrganizationInvitation,
  replaceOrganizationInvitationEmail,
  resendOrganizationInvitation,
  revokeOrganizationInvitation
} from "@/lib/server/organization-invitations";

const inviteMemberSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email()
});

const manageInvitationSchema = z.object({
  organizationId: z.string().uuid(),
  invitationId: z.string().uuid()
});

const replaceInvitationSchema = manageInvitationSchema.extend({
  email: z.string().email()
});

async function requireInvitationManagementAccess(organizationId: string) {
  const access = await getOrganizationMemberAccess(organizationId);

  if (!access) {
    throw new Error("Organização não encontrada.");
  }

  if (!access.canManageInvitations) {
    throw new Error("Você não tem permissão para gerenciar convites desta organização.");
  }

  return access;
}

export async function inviteOrganizationMemberAction(rawInput: unknown) {
  const input = inviteMemberSchema.parse(rawInput);
  const organization = await requireInvitationManagementAccess(input.organizationId);

  if (organization.email && input.email.trim().toLowerCase() === organization.email.trim().toLowerCase()) {
    throw new Error("Você já faz parte desta organização");
  }

  const result = await createOrganizationInvitation({
    organizationId: organization.organizationId,
    email: input.email,
    invitedByUserId: organization.userId
  });

  revalidatePath("/organization/members");
  return result;
}

export async function resendOrganizationInvitationAction(rawInput: unknown) {
  const input = manageInvitationSchema.parse(rawInput);
  const organization = await requireInvitationManagementAccess(input.organizationId);

  const result = await resendOrganizationInvitation({
    organizationId: organization.organizationId,
    invitationId: input.invitationId,
    actorUserId: organization.userId
  });

  revalidatePath("/organization/members");
  return result;
}

export async function revokeOrganizationInvitationAction(rawInput: unknown) {
  const input = manageInvitationSchema.parse(rawInput);
  const organization = await requireInvitationManagementAccess(input.organizationId);

  const result = await revokeOrganizationInvitation({
    organizationId: organization.organizationId,
    invitationId: input.invitationId,
    actorUserId: organization.userId
  });

  revalidatePath("/organization/members");
  return result;
}

export async function replaceOrganizationInvitationEmailAction(rawInput: unknown) {
  const input = replaceInvitationSchema.parse(rawInput);
  const organization = await requireInvitationManagementAccess(input.organizationId);

  const result = await replaceOrganizationInvitationEmail({
    organizationId: organization.organizationId,
    invitationId: input.invitationId,
    actorUserId: organization.userId,
    email: input.email
  });

  revalidatePath("/organization/members");
  return result;
}
