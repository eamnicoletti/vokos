"use client";

import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OpenBillingPortalButton } from "@/features/billing/open-billing-portal-button";
import type { OrganizationWorkspaceStatus } from "@/lib/db/organizations";

type WorkspaceUpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  status: OrganizationWorkspaceStatus;
};

export function WorkspaceUpgradeDialog({
  open,
  onOpenChange,
  organizationId,
  status
}: WorkspaceUpgradeDialogProps) {
  const maxWorkspacesLabel =
    status.maxWorkspaces === null
      ? "workspaces ilimitados"
      : status.maxWorkspaces === 1
        ? "1 workspace"
        : `${status.maxWorkspaces} workspaces`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 sm:max-w-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <DialogHeader className="relative">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle>O limite de workspaces do plano foi atingido</DialogTitle>
          <DialogDescription>
            A organização <strong>{status.organizationName}</strong> está no plano <strong>{status.planLabel}</strong> e
            já usa <strong>{status.activeWorkspacesCount}</strong> de <strong>{maxWorkspacesLabel}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-3 rounded-2xl border border-primary/10 bg-background/80 p-4 text-sm">
          <p className="font-medium text-foreground">Destrave novos workspaces para organizar melhor a operação do escritório.</p>
          <p className="text-muted-foreground">
            Com um plano superior, você pode separar áreas, times e fluxos de trabalho sem concentrar tudo em um único workspace.
          </p>
        </div>

        <DialogFooter className="relative">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
          <OpenBillingPortalButton organizationId={organizationId} returnPath="/organization/billing" intent="upgrade">
            Ver opções de upgrade
          </OpenBillingPortalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
