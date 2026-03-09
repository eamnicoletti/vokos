"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import type { WorkspaceTaskOverview } from "@/lib/db/workspaces";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SortField = "date" | "priority" | "tag";
type SortDirection = "asc" | "desc";

type WorkspaceTask = WorkspaceTaskOverview["statuses"][number]["tasks"][number];

function listTone(listName: string) {
  const normalized = listName.trim().toLowerCase();
  if (normalized === "inbox juridico" || normalized === "inbox jurídico") {
    return "bg-yellow-500/15 text-yellow-800";
  }
  if (normalized === "em andamento") {
    return "bg-red-500/15 text-red-800";
  }
  if (normalized === "revisao" || normalized === "revisão") {
    return "bg-blue-500/15 text-blue-800";
  }
  if (normalized === "concluido" || normalized === "concluído") {
    return "bg-lime-500/15 text-lime-800";
  }
  return "bg-muted text-muted-foreground";
}

function isCompletedStatus(statusName: string) {
  const normalized = statusName.trim().toLowerCase();
  return normalized === "concluido" || normalized === "concluído" || normalized === "done";
}

function sortFieldLabel(sortField: SortField) {
  if (sortField === "date") return "Data";
  if (sortField === "priority") return "Prioridade";
  return "Tag";
}

function priorityMeta(priority: "low" | "medium" | "high" | "urgent" | null) {
  if (priority === "urgent") return { label: "Urgente", tone: "bg-rose-100 text-rose-700", rank: 4 };
  if (priority === "high") return { label: "Alta", tone: "bg-orange-100 text-orange-700", rank: 3 };
  if (priority === "medium") return { label: "Média", tone: "bg-sky-100 text-sky-700", rank: 2 };
  if (priority === "low") return { label: "Baixa", tone: "bg-slate-100 text-slate-700", rank: 1 };
  return { label: "Sem prioridade", tone: "bg-muted text-muted-foreground", rank: 0 };
}

function sourceTypeLabel(sourceType: "manual" | "email" | "dje" | "portal") {
  if (sourceType === "email") return "E-mail";
  if (sourceType === "dje") return "DJE";
  if (sourceType === "portal") return "Portal";
  return "Manual";
}

function dueDateLabel(value: string | null) {
  if (!value) return "Sem prazo";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function assigneeFallback(assigneeUserId: string | null) {
  if (!assigneeUserId) return "--";
  return assigneeUserId.replace(/-/g, "").slice(0, 2).toUpperCase();
}

function compareTasks(left: WorkspaceTask, right: WorkspaceTask, sortField: SortField, sortDirection: SortDirection) {
  if (sortField === "date") {
    const leftDate = left.dueDate ? new Date(left.dueDate).getTime() : null;
    const rightDate = right.dueDate ? new Date(right.dueDate).getTime() : null;

    if (leftDate === null && rightDate !== null) return 1;
    if (leftDate !== null && rightDate === null) return -1;
    if (leftDate !== null && rightDate !== null && leftDate !== rightDate) {
      return sortDirection === "asc" ? leftDate - rightDate : rightDate - leftDate;
    }
  }

  if (sortField === "priority") {
    const leftRank = priorityMeta(left.priority).rank;
    const rightRank = priorityMeta(right.priority).rank;
    if (leftRank !== rightRank) {
      return sortDirection === "asc" ? leftRank - rightRank : rightRank - leftRank;
    }
  }

  if (sortField === "tag") {
    const leftTag = sourceTypeLabel(left.sourceType);
    const rightTag = sourceTypeLabel(right.sourceType);
    const tagCompare = leftTag.localeCompare(rightTag, "pt-BR");
    if (tagCompare !== 0) {
      return sortDirection === "asc" ? tagCompare : -tagCompare;
    }
  }

  return left.title.localeCompare(right.title, "pt-BR");
}

type WorkspaceTaskPanelProps = {
  overview: WorkspaceTaskOverview[];
};

export function WorkspaceTaskPanel({ overview }: WorkspaceTaskPanelProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const computed = useMemo(
    () =>
      overview.map((workspace) => {
        const activeStatuses = workspace.statuses.filter((status) => !isCompletedStatus(status.name));
        const activeStatusesSorted = activeStatuses.map((status) => ({
          ...status,
          tasks: [...status.tasks].sort((left, right) => compareTasks(left, right, sortField, sortDirection))
        }));

        const activeTasksCount = activeStatuses.reduce((sum, status) => sum + status.tasks.length, 0);

        return {
          ...workspace,
          activeStatuses: activeStatusesSorted,
          activeTasksCount
        };
      }),
    [overview, sortDirection, sortField]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Ordenar por</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {sortFieldLabel(sortField)}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Ordenação</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <DropdownMenuRadioItem value="date">Data</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority">Prioridade</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tag">Tag</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"))}
        >
          <ArrowDownUp className="size-4" />
          {sortDirection === "asc" ? "Ascendente" : "Descendente"}
        </Button>
      </div>

      {computed.map((workspace) => (
        <Card key={workspace.workspaceId} className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl">{workspace.workspaceName}</CardTitle>
                <CardDescription>
                  {workspace.activeTasksCount} tarefa(s) distribuída(s) em {workspace.statuses.length} status
                </CardDescription>
              </div>
              {workspace.defaultBoardId ? (
                <Link href={`/boards/${workspace.defaultBoardId}`} className="text-sm font-medium text-primary">
                  Abrir board
                </Link>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {workspace.activeStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa ativa para este workspace.</p>
            ) : (
              workspace.activeStatuses.map((status) => (
                <section key={status.id} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                    <Badge variant="outline" className={`${listTone(status.name)} rounded-full px-2 py-1 text-sm`}>
                      {status.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{status.tasks.length}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[860px]">
                      <div className="grid grid-cols-[minmax(0,1.6fr)_180px_130px_150px_120px_90px] border-b px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <span>Nome</span>
                        <span>Responsável</span>
                        <span>Data</span>
                        <span>Prioridade</span>
                        <span>Tag</span>
                        <span className="text-right">Ação</span>
                      </div>

                      {status.tasks.length === 0 ? (
                        <div className="border-b px-4 py-3 text-sm text-muted-foreground">Sem tarefas ativas nesse status.</div>
                      ) : (
                        status.tasks.map((task) => {
                          const priority = priorityMeta(task.priority);
                          return (
                            <div
                              key={task.id}
                              className="grid grid-cols-[minmax(0,1.6fr)_180px_130px_150px_120px_90px] items-center border-b px-4 py-3 text-sm transition-colors hover:bg-muted/20"
                            >
                              <p className="truncate font-medium">{task.title}</p>
                              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <Avatar className="size-6">
                                  <AvatarFallback className="text-[10px]">{assigneeFallback(task.assigneeUserId)}</AvatarFallback>
                                </Avatar>
                                {task.assigneeUserId ? "Responsável" : "Sem responsável"}
                              </span>
                              <span className="text-xs">{dueDateLabel(task.dueDate)}</span>
                              <span>
                                <Badge variant="outline" className={priority.tone}>
                                  {priority.label}
                                </Badge>
                              </span>
                              <span>
                                <Badge variant="secondary">{sourceTypeLabel(task.sourceType)}</Badge>
                              </span>
                              <span className="text-right">
                                <Link href={`/boards/${task.boardId}`} className="text-xs font-medium text-primary">
                                  Abrir
                                </Link>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
