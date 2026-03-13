"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { OrganizationWorkspaceStatus } from "@/lib/db/organizations";
import { WorkspaceUpgradeDialog } from "./workspace-upgrade-dialog";

type WorkspaceBootstrapProps = {
  organizationId: string;
  workspaceStatus: OrganizationWorkspaceStatus;
};

export function WorkspaceBootstrap({ organizationId, workspaceStatus }: WorkspaceBootstrapProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function onCreateWorkspace() {
    if (name.trim().length < 3) {
      return;
    }

    startTransition(async () => {
      const request = createWorkspaceAction({ name: name.trim() });
      toast.promise(request, {
        loading: "Criando workspace...",
        success: "Workspace criado com sucesso.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao criar workspace")
      });

      try {
        const result = await request;
        router.push(`/boards/${result.boardId}`);
        router.refresh();
        setName("");
        setOpen(false);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Não é possível criar outro workspace")) {
          setOpen(false);
          setUpgradeDialogOpen(true);
        }
      }
    });
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader className="relative pb-4">
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <FolderPlus className="size-8" />
        </div>
        <CardTitle className="text-3xl font-semibold leading-tight">Crie seu primeiro workspace</CardTitle>
        <CardDescription className="max-w-2xl text-base text-muted-foreground">
          Crie agora seu primeiro workspace e comece a automatizar suas tarefas e compartilhar com sua equipe.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="h-11 px-6 text-base"
              onClick={(event) => {
                if (!workspaceStatus.canCreateMoreWorkspaces) {
                  event.preventDefault();
                  setUpgradeDialogOpen(true);
                }
              }}
            >
              + Criar Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar workspace</DialogTitle>
              <DialogDescription>Ao criar, o Vokos inicializa Projeto Inicial, Board Principal e listas padrão.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                placeholder="Nome do workspace"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onCreateWorkspace();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 3 caracteres.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={pending || name.trim().length < 3} onClick={onCreateWorkspace}>
                {pending ? "Criando..." : "Criar workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <WorkspaceUpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          organizationId={organizationId}
          status={workspaceStatus}
        />
      </CardContent>
    </Card>
  );
}
