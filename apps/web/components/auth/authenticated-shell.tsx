"use client";

import type { Route } from "next";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { LogoIcon } from "@/components/logo";
import type { OrganizationContext } from "@/lib/auth";
import type { OrganizationWorkspaceStatus } from "@/lib/db/organizations";
import type { WorkspaceMembership } from "@/lib/db/workspaces";
import type { UserProfileSummary } from "@/lib/user-profile";

type AuthenticatedShellProps = PropsWithChildren<{
  memberships: WorkspaceMembership[];
  currentUser: UserProfileSummary;
  currentOrganization: OrganizationContext;
  organizations: OrganizationContext[];
  workspaceStatus: OrganizationWorkspaceStatus;
}>;

export function AuthenticatedShell({
  children,
  memberships,
  currentUser,
  currentOrganization,
  organizations,
  workspaceStatus
}: AuthenticatedShellProps) {
  const pathname = usePathname();

  const context = useMemo(() => {
    if (pathname === "/workspace") {
      return {
        rootLabel: "Workspaces",
        pageLabel: "Tarefas",
        rootHref: "/workspace"
      };
    }

    if (pathname === "/organization/billing") {
      return {
        rootLabel: "Organização",
        pageLabel: "Assinatura",
        rootHref: "/organization/billing"
      };
    }

    if (pathname === "/organization/members") {
      return {
        rootLabel: "Organização",
        pageLabel: "Membros",
        rootHref: "/organization/members"
      };
    }

    if (pathname === "/conta/cobrancas") {
      return {
        rootLabel: "Minha conta",
        pageLabel: "Cobranças",
        rootHref: "/conta/cobrancas"
      };
    }

    if (pathname === "/conta/profile") {
      return {
        rootLabel: "Minha conta",
        pageLabel: "Perfil",
        rootHref: "/conta/profile"
      };
    }


    const boardMatch = pathname.match(/^\/boards\/([0-9a-f-]+)$/i);
    if (boardMatch) {
      const boardId = boardMatch[1];
      const membership = memberships.find((item) => item.default_board_id === boardId);
      return {
        rootLabel: membership?.workspace.name ?? "Workspace",
        pageLabel: "Board",
        rootHref: "/workspace"
      };
    } 

    return {
      rootLabel: "Vokos",
      pageLabel: "App",
      rootHref: "/workspace"
    };
  }, [memberships, pathname]);

  return (
    <SidebarProvider>
      <AppSidebar
        memberships={memberships}
        currentUser={currentUser}
        currentOrganization={currentOrganization}
        organizations={organizations}
        workspaceStatus={workspaceStatus}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={context.rootHref as Route}>{context.rootLabel}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{context.pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4 mr-2">
            <Link href="/" aria-label="Vokos" className="flex items-center">
              <LogoIcon size="size-6" />
            </Link>
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col px-4 py-4 md:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
