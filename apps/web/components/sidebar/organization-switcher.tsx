"use client";

import * as React from "react";
import type { Route } from "next";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setActiveOrganizationAction } from "@/app/(app)/actions";
import type { OrganizationContext } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

type OrganizationSwitcherProps = {
  organizations: OrganizationContext[];
  currentOrganizationId: string;
};

export function OrganizationSwitcher({ organizations, currentOrganizationId }: OrganizationSwitcherProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = React.useTransition();
  const activeOrganization =
    organizations.find((organization) => organization.organizationId === currentOrganizationId) ?? organizations[0];

  if (!activeOrganization) {
    return null;
  }

  function handleSelectOrganization(organizationId: string) {
    if (organizationId === currentOrganizationId) {
      return;
    }

    startTransition(async () => {
      const request = setActiveOrganizationAction({ organizationId });
      toast.promise(request, {
        loading: "Alternando organizacao...",
        success: "Organizacao atualizada.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao alternar organizacao")
      });

      try {
        const result = await request;
        router.push(result.boardId ? `/boards/${result.boardId}` : "/workspace");
        router.refresh();
      } catch {
        // Toast already handles the feedback.
      }
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrganization.organizationName}</span>
                <span className="truncate text-xs">{activeOrganization.planLabel}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Organizacoes ativas</DropdownMenuLabel>
            {organizations.map((organization) => {
              const isCurrent = organization.organizationId === currentOrganizationId;
              return (
                <DropdownMenuItem
                  key={organization.organizationId}
                  onClick={() => handleSelectOrganization(organization.organizationId)}
                  className="gap-3 p-2"
                  disabled={isPending}
                >
                  <div className="flex size-8 items-center justify-center rounded-md border bg-muted/40">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{organization.organizationName}</div>
                    <div className="truncate text-xs text-muted-foreground">{organization.planLabel}</div>
                  </div>
                  {isCurrent ? <Check className="size-4 text-emerald-500" /> : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => router.push("/organization/setup" as Route)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Nova organizacao</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
