import type { Route } from "next";
import { redirect } from "next/navigation";
import { InviteAcceptState } from "@/features/organization/invite-accept-state";
import { buildInvitationAcceptPath, hashInvitationToken, isInvitationExpired } from "@/lib/invitations";
import { getOrganizationInvitationByTokenHash } from "@/lib/db/organizations";
import {
  acceptOrganizationInvitationToken,
  markOrganizationInvitationExpiredById,
  OrganizationUserLimitError
} from "@/lib/server/organization-invitations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type InviteAcceptPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InviteAcceptState
        title="Convite inválido"
        description="O link de convite está incompleto ou não pode ser validado."
        tone="warning"
        primaryHref="/login"
        primaryLabel="Ir para login"
      />
    );
  }

  const invitation = await getOrganizationInvitationByTokenHash(hashInvitationToken(token));

  if (!invitation) {
    return (
      <InviteAcceptState
        title="Convite inválido"
        description="Não encontramos um convite correspondente a este link."
        tone="warning"
        primaryHref="/login"
        primaryLabel="Ir para login"
      />
    );
  }

  if (invitation.status === "revoked") {
    return (
        <InviteAcceptState
          title="Convite revogado"
          description={`O convite para ${invitation.organizationName} foi revogado. Solicite um novo convite ao administrador da organização.`}
          tone="warning"
          primaryHref="/login"
          primaryLabel="Ir para login"
        />
    );
  }

  if (isInvitationExpired(invitation.expiresAt)) {
    await markOrganizationInvitationExpiredById(invitation.organizationId, invitation.id);
    return (
        <InviteAcceptState
          title="Convite expirado"
          description={`O convite para ${invitation.organizationName} expirou. Solicite um novo envio ao administrador da organização.`}
          tone="warning"
          primaryHref="/login"
          primaryLabel="Ir para login"
        />
    );
  }

  const nextPath = buildInvitationAcceptPath(token);
  const invitationOrganization = encodeURIComponent(invitation.organizationName);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitation.email)}&organization=${invitationOrganization}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitation.email)}&organization=${invitationOrganization}`;
  const switchAccountHref = `/auth/switch-account?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitation.email)}`;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InviteAcceptState
        title={`Convite para ${invitation.organizationName}`}
        description={`Entre ou crie sua conta com ${invitation.email} para aceitar este convite.`}
        tone="default"
        primaryHref={loginHref}
        primaryLabel="Entrar"
        secondaryHref={signupHref}
        secondaryLabel="Criar conta"
      />
    );
  }

  if (!user.email) {
    return (
      <InviteAcceptState
        title="Não foi possível validar sua conta"
        description="Sua sessão atual não possui um e-mail verificável para aceitar este convite."
        tone="warning"
        primaryHref="/workspace"
        primaryLabel="Voltar para o app"
      />
    );
  }

  let result:
    | Awaited<ReturnType<typeof acceptOrganizationInvitationToken>>
    | null = null;

  try {
    result = await acceptOrganizationInvitationToken({
      token,
      userId: user.id,
      userEmail: user.email
    });
  } catch (error) {
    if (error instanceof OrganizationUserLimitError) {
      return (
        <InviteAcceptState
          title="Não foi possível aceitar o convite"
          description={`A organização "${error.organizationName}" está no plano "${error.planLabel}", que permite até ${error.maxUsers} ${error.maxUsers === 1 ? "membro" : "membros"}. Para liberar novos acessos, peça ao administrador para fazer upgrade do plano.`}
          tone="warning"
          primaryHref="/#planos"
          primaryLabel="Ver planos"
          secondaryHref="/login"
          secondaryLabel="Entrar com outra conta"
        />
      );
    }

    const message = error instanceof Error ? error.message : "Não foi possível aceitar o convite.";
    return (
      <InviteAcceptState
        title="Não foi possível aceitar o convite"
        description={message}
        tone="warning"
        primaryHref="/workspace"
        primaryLabel="Ir para o app"
        secondaryHref={user.email !== invitation.email ? switchAccountHref : undefined}
        secondaryLabel={user.email !== invitation.email ? "Entrar com outro e-mail" : undefined}
      />
    );
  }

  const destination = result.boardId
    ? `/workspace?welcomeOrganization=${encodeURIComponent(result.organizationName)}&boardId=${result.boardId}`
    : `/workspace?welcomeOrganization=${encodeURIComponent(result.organizationName)}`;

  redirect(destination as Route);
}
