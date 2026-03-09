"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AudioWaveform, BriefcaseBusiness, ChevronDown, FolderKanban, GalleryVerticalEnd, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceAction, signOutAction } from "@/app/(app)/actions";
import type { WorkspaceMembership } from "@/lib/db/workspaces";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "./organization-switcher";
import { NavUser } from "./nav-user";


// This is sample data.
const data = {
  organizations: [
    {
      name: "Faria & Silva Advogados",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Nelson Wilians Advogados Associados",
      logo: AudioWaveform,
      plan: "Equipe",
    },
    {
      name: "Demarest Advogados",
      logo: BriefcaseBusiness,
      plan: "Essencial",
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  memberships: WorkspaceMembership[];
  userEmail: string;
};

export function AppSidebar({ memberships, userEmail, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const [pendingCreate, startCreateTransition] = useTransition();
  const [pendingSignout, startSignoutTransition] = useTransition();

  function handleCreateWorkspace() {
    if (newWorkspaceName.trim().length < 3) {
      return;
    }

    startCreateTransition(async () => {
      const request = createWorkspaceAction({ name: newWorkspaceName });
      toast.promise(request, {
        loading: "Criando workspace...",
        success: "Workspace criado com sucesso.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao criar workspace")
      });

      try {
        const result = await request;
        setIsCreateOpen(false);
        setNewWorkspaceName("");
        router.push(`/boards/${result.boardId}`);
        router.refresh();
      } catch {
        // Error feedback is handled by toast.promise.
      }
    });
  }

  function handleSignOut() {
    startSignoutTransition(async () => {
      const request = signOutAction();
      toast.promise(request, {
        loading: "Encerrando sessão...",
        success: "Sessão encerrada.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao encerrar sessão")
      });

      try {
        await request;
        router.push("/login");
        router.refresh();
      } catch {
        // Error feedback handled by toast.
      }
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
      <OrganizationSwitcher organizations={data.organizations} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <SidebarGroupAction aria-label="Criar workspace">
                    <Plus />
                  </SidebarGroupAction>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Criar workspace</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo workspace</DialogTitle>
                <DialogDescription>Cria Projeto Inicial, Board Principal e listas base.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateWorkspace();
                }}
              >
                <Input
                  placeholder="Nome do workspace"
                  value={newWorkspaceName}
                  onChange={(event) => setNewWorkspaceName(event.target.value)}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={pendingCreate || newWorkspaceName.trim().length < 3}>
                    {pendingCreate ? "Criando..." : "Criar workspace"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton type="button" onClick={() => setWorkspacesOpen((value) => !value)}>
                  <ChevronDown className={`transition-transform ${workspacesOpen ? "rotate-0" : "-rotate-90"}`} />
                  <span>Minhas workspaces</span>
                </SidebarMenuButton>
                {workspacesOpen ? (
                  <SidebarMenuSub>
                    {memberships.length === 0 ? (
                      <SidebarMenuSubItem>
                        <span className="px-2 text-xs text-sidebar-foreground/70">Nenhuma workspace criada</span>
                      </SidebarMenuSubItem>
                    ) : (
                      memberships.map((membership) => {
                        const href = membership.default_board_id ? `/boards/${membership.default_board_id}` : "/workspace";
                        const isActive =
                          pathname === href ||
                          (membership.default_board_id ? pathname === `/boards/${membership.default_board_id}` : false);

                        return (
                          <SidebarMenuSubItem key={membership.workspace_id}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={href as Route}>
                                <span>{membership.workspace.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })
                    )}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace"}>
                  <Link href="/workspace">
                    <FolderKanban />
                    <span>Todas as tarefas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SidebarMenuButton type="button">
                      <Users />
                      <span>Adicionar membro</span>
                    </SidebarMenuButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Fluxo de membros entra no M2</AlertDialogTitle>
                      <AlertDialogDescription>
                        Nesta fase M1, a tela exibe navegação do workspace e board. O convite de membros será habilitado no M2.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction>Entendi</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      
      <SidebarFooter>
        <NavUser
          user={{
            name: userEmail?.split("@")[0]?.replace(/[._-]+/g, " ")?.trim() || "Usuário Vokos",
            email: userEmail || "usuario@vokos.ai",
            avatar: "",
          }}
          loggingOut={pendingSignout}
          onLogout={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
