"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChartColumn, ChevronDown, CreditCard, FileText, FolderKanban, HelpCircle, Plus, Search, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceAction, signOutAction } from "@/app/(app)/actions";
import type { OrganizationContext } from "@/lib/auth";
import type { WorkspaceMembership } from "@/lib/db/workspaces";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "./organization-switcher";
import { NavUser } from "./nav-user";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  memberships: WorkspaceMembership[];
  userEmail: string;
  currentOrganization: OrganizationContext;
  organizations: OrganizationContext[];
};

export function AppSidebar({ memberships, userEmail, currentOrganization, organizations, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const [pendingCreate, startCreateTransition] = useTransition();
  const [pendingSignout, startSignoutTransition] = useTransition();
  const visibleMemberships = memberships.filter((membership) => membership.organization_id === currentOrganization.organizationId);
  const currentOrganizationAccessRole =
    currentOrganization.role === "owner"
      ? "admin"
      : visibleMemberships.find((membership) => membership.role === "admin" || membership.role === "manager")?.role ??
        visibleMemberships[0]?.role ??
        "member";
  const canSeeAdminGroup = currentOrganizationAccessRole === "admin" || currentOrganizationAccessRole === "manager";
  const canSeeSubscription = currentOrganization.role === "owner";

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
        <OrganizationSwitcher organizations={organizations} currentOrganizationId={currentOrganization.organizationId} />
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
                    {visibleMemberships.length === 0 ? (
                      <SidebarMenuSubItem>
                        <span className="px-2 text-xs text-sidebar-foreground/70">Nenhuma workspace criada</span>
                      </SidebarMenuSubItem>
                    ) : (
                      visibleMemberships.map((membership) => {
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
                    <span>Lista de tarefas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/organization/analytics"}>
                  <Link href={"/organization/analytics" as Route}>
                    <ChartColumn />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/organization/members"}>
                  <Link href={"/organization/members" as Route}>
                    <Users />
                    <span>Membros</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canSeeAdminGroup ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canSeeSubscription ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/organization/billing"}>
                      <Link href={"/organization/billing" as Route}>
                        <CreditCard />
                        <span>Assinatura</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/organization/configurations"}>
                    <Link href={"/organization/configurations" as Route}>
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/organization/reports"}>
                    <Link href={"/organization/reports" as Route}>
                      <FileText />
                      <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>          
        ) : null}

        <SidebarGroup className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/help"}>
              <Link href={"/help" as Route}>
                <HelpCircle />
                <span>Ajuda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/organization/procurar"}>
              <Link href={"/organization/procurar" as Route}>
                <Search />
                <span>Procurar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
