"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Copy, MailPlus, RefreshCw, ShieldCheck, Sparkles, Trash2, UserRoundPlus, Users } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationContext } from "@/lib/auth";
import type { OrganizationInvitationRecord, OrganizationMemberRecord, OrganizationSeatStatus } from "@/lib/db/organizations";
import {
  inviteOrganizationMemberAction,
  replaceOrganizationInvitationEmailAction,
  resendOrganizationInvitationAction,
  revokeOrganizationInvitationAction
} from "@/app/(app)/organization/members/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OrganizationMembersPanelProps = {
  organization: OrganizationContext;
  members: OrganizationMemberRecord[];
  invitations: OrganizationInvitationRecord[];
  seatStatus: OrganizationSeatStatus;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusTone(status: OrganizationInvitationRecord["effectiveStatus"]) {
  if (status === "pending") return "bg-amber-500/10 text-amber-700";
  if (status === "accepted") return "bg-emerald-500/10 text-emerald-700";
  if (status === "expired") return "bg-slate-500/10 text-slate-700";
  return "bg-rose-500/10 text-rose-700";
}

function statusLabel(status: OrganizationInvitationRecord["effectiveStatus"]) {
  if (status === "pending") return "Pendente";
  if (status === "accepted") return "Aceito";
  if (status === "expired") return "Expirado";
  return "Revogado";
}

export function OrganizationMembersPanel({
  organization,
  members,
  invitations,
  seatStatus
}: OrganizationMembersPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [editingInvitation, setEditingInvitation] = useState<OrganizationInvitationRecord | null>(null);
  const [replacementEmail, setReplacementEmail] = useState("");

  const activeMembers = members.filter((member) => member.isActive);
  const pendingInvitations = invitations.filter((invitation) => invitation.effectiveStatus === "pending");

  function rememberInviteLink(invitationId: string, inviteLink: string) {
    setInviteLinks((current) => ({ ...current, [invitationId]: inviteLink }));
  }

  function copyInviteLink(invitationId: string) {
    const inviteLink = inviteLinks[invitationId];
    if (!inviteLink) {
      toast.info("Reenvie o convite para gerar um novo link copiável.");
      return;
    }

    void navigator.clipboard.writeText(inviteLink).then(
      () => toast.success("Link do convite copiado."),
      () => toast.error("Não foi possível copiar o link do convite.")
    );
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function handleInviteSubmit() {
    if (!organization || !inviteEmail.trim()) {
      return;
    }

    if (!isValidEmail(inviteEmail)) {
      toast.error("Digite um e-mail válido para enviar o convite.");
      return;
    }

    if (!seatStatus.canInviteMoreUsers && seatStatus.maxUsers !== null) {
      setInviteDialogOpen(false);
      setUpgradeDialogOpen(true);
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading("Criando convite...");
      const request = inviteOrganizationMemberAction({
        organizationId: organization.organizationId,
        email: inviteEmail.trim()
      });

      try {
        const result = await request;
        rememberInviteLink(result.invitationId, result.inviteLink);
        toast.dismiss(toastId);
        toast.success(
          result.deliveryError
            ? "Convite criado, mas o e-mail não foi enviado automaticamente."
            : "Convite criado e e-mail enviado."
        );
        if (result.deliveryError) toast.info(result.deliveryError);
        setInviteEmail("");
        setInviteDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast.dismiss(toastId);
        const message = error instanceof Error ? error.message : "Falha ao criar convite";
        toast.error(message);
        if (message.includes("Não é possível adicionar mais membros")) {
          setInviteDialogOpen(false);
          setUpgradeDialogOpen(true);
        }
      }
    });
  }

  function handleResend(invitationId: string) {
    startTransition(async () => {
      const toastId = toast.loading("Reenviando convite...");
      const request = resendOrganizationInvitationAction({
        organizationId: organization.organizationId,
        invitationId
      });

      try {
        const result = await request;
        rememberInviteLink(result.invitationId, result.inviteLink);
        toast.dismiss(toastId);
        toast.success(
          result.deliveryError
            ? "Convite reenviado, mas o e-mail não foi enviado automaticamente."
            : "Convite reenviado e e-mail enviado."
        );
        if (result.deliveryError) toast.info(result.deliveryError);
        router.refresh();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(error instanceof Error ? error.message : "Falha ao reenviar convite");
      }
    });
  }

  function handleRevoke(invitationId: string) {
    startTransition(async () => {
      const toastId = toast.loading("Revogando convite...");
      const request = revokeOrganizationInvitationAction({
        organizationId: organization.organizationId,
        invitationId
      });

      try {
        await request;
        toast.dismiss(toastId);
        toast.success("Convite revogado.");
        router.refresh();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(error instanceof Error ? error.message : "Falha ao revogar convite");
      }
    });
  }

  function handleReplaceEmail() {
    if (!editingInvitation || !replacementEmail.trim()) {
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading("Corrigindo e recriando convite...");
      const request = replaceOrganizationInvitationEmailAction({
        organizationId: organization.organizationId,
        invitationId: editingInvitation.id,
        email: replacementEmail.trim()
      });

      try {
        const result = await request;
        rememberInviteLink(result.invitationId, result.inviteLink);
        toast.dismiss(toastId);
        toast.success(
          result.deliveryError
            ? "Convite corrigido, mas o e-mail não foi enviado automaticamente."
            : "Convite corrigido e e-mail enviado."
        );
        if (result.deliveryError) toast.info(result.deliveryError);
        setEditingInvitation(null);
        setReplacementEmail("");
        router.refresh();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(error instanceof Error ? error.message : "Falha ao corrigir convite");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <CardTitle>Equipe da organização</CardTitle>
                <CardDescription>{organization.organizationName}</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                if (!seatStatus.canInviteMoreUsers && seatStatus.maxUsers !== null) {
                  setUpgradeDialogOpen(true);
                  return;
                }
                setInviteDialogOpen(true);
              }}
            >
              <UserRoundPlus className="mr-2 size-4" />
              Convidar membro
            </Button>
          </div>
          {!seatStatus.canInviteMoreUsers && seatStatus.maxUsers !== null ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              A organização está no limite do plano {seatStatus.planLabel}: {seatStatus.activeUsersCount}/{seatStatus.maxUsers} membro(s).
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Membros ativos</CardTitle>
            <CardDescription>{activeMembers.length} pessoa(s) com acesso atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro ativo além do administrador.</p>
            ) : (
              activeMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.fullName || member.email}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-full", member.role === "owner" ? "bg-blue-500/10 text-blue-700" : "")}>
                      {member.role === "owner" ? (
                        <>
                          <ShieldCheck className="mr-1 size-3.5" />
                          Administrador
                        </>
                      ) : (
                        "Membro"
                      )}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
            <CardDescription>{pendingInvitations.length} convite(s) aguardando aceite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite criado para esta organização.</p>
            ) : (
              invitations.map((invitation) => (
                <div key={invitation.id} className="space-y-3 rounded-xl border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Convidado por {invitation.invitedByName || invitation.invitedByEmail}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("rounded-full", statusTone(invitation.effectiveStatus))}>
                      {statusLabel(invitation.effectiveStatus)}
                    </Badge>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <p>Criado em {formatDateTime(invitation.createdAt)}</p>
                    <p>Expira em {formatDateTime(invitation.expiresAt)}</p>
                    <p>Último envio em {formatDateTime(invitation.lastSentAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending || invitation.effectiveStatus === "accepted" || invitation.effectiveStatus === "revoked"}
                      onClick={() => handleResend(invitation.id)}
                    >
                      <RefreshCw className="mr-2 size-3.5" />
                      Reenviar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => copyInviteLink(invitation.id)}
                    >
                      <Copy className="mr-2 size-3.5" />
                      Copiar link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending || invitation.effectiveStatus === "accepted"}
                      onClick={() => {
                        setEditingInvitation(invitation);
                        setReplacementEmail(invitation.email);
                      }}
                    >
                      <MailPlus className="mr-2 size-3.5" />
                      Corrigir e-mail
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending || invitation.effectiveStatus === "accepted" || invitation.effectiveStatus === "revoked"}
                      onClick={() => handleRevoke(invitation.id)}
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      Revogar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editingInvitation !== null} onOpenChange={(open) => !open && setEditingInvitation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir e-mail do convite</DialogTitle>
            <DialogDescription>
              O convite atual sera revogado e um novo convite sera criado com e-mail corrigido.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={replacementEmail}
            onChange={(event) => setReplacementEmail(event.target.value)}
            placeholder="novo-email@cliente.com"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingInvitation(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={pending || !replacementEmail.trim()} onClick={handleReplaceEmail}>
              Salvar e reenviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              Adicione um e-mail para gerar um novo convite para esta organização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder="convite@cliente.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleInviteSubmit();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              O fluxo já gera o link seguro de aceite. Enquanto o disparo transactional de e-mail não estiver configurado,
              use o botão de copiar link para compartilhar o convite.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={pending || !inviteEmail.trim() || !isValidEmail(inviteEmail)} onClick={handleInviteSubmit}>
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle>Seu plano atual chegou ao limite de membros</DialogTitle>
            <DialogDescription>
              A organização <strong>{seatStatus.organizationName}</strong> está no plano <strong>{seatStatus.planLabel}</strong>,
              que permite até <strong>{seatStatus.maxUsers}</strong> membro(s). Para convidar mais pessoas, será necessário fazer upgrade do plano.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Com mais assentos, o time consegue centralizar tarefas, comentários e histórico de auditoria em um único fluxo.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Agora não
            </Button>
            <Button type="button" asChild>
              <a href="/#planos">
                Ver upgrade de plano
                <ArrowUpRight className="ml-2 size-4" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
