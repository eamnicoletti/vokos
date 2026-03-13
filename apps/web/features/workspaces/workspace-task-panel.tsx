"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Calendar, Flag, SquareArrowOutUpRight } from "lucide-react";
import type { WorkspaceTaskOverview } from "@/lib/db/workspaces";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AddTaskDialog } from "@/features/boards/add-task-dialog";
import { Card } from "@/components/ui/card";

type ColField = "title" | "assignee" | "date" | "priority" | "tag";
type SortDirection = "asc" | "desc";
type StatusSort = { field: ColField; direction: SortDirection };

type WorkspaceTask = WorkspaceTaskOverview["statuses"][number]["tasks"][number];

function listTone(listName: string) {
  const n = listName.trim().toLowerCase();
  if (n === "inbox juridico" || n === "inbox jurídico")
    return "bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
  if (n === "em andamento")
    return "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-400";
  if (n === "revisao" || n === "revisão")
    return "bg-blue-500/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
  if (n === "concluido" || n === "concluído")
    return "bg-lime-500/15 text-lime-800 dark:bg-lime-500/20 dark:text-lime-400";
  return "bg-muted text-muted-foreground";
}

function statusDotClass(listName: string) {
  const n = listName.trim().toLowerCase();
  if (n === "inbox juridico" || n === "inbox jurídico") return "bg-yellow-500";
  if (n === "em andamento") return "bg-red-500";
  if (n === "revisao" || n === "revisão") return "bg-blue-500";
  if (n === "concluido" || n === "concluído") return "bg-lime-500";
  return "bg-muted-foreground";
}

function statusBgClass(listName: string) {
  const n = listName.trim().toLowerCase();
  if (n === "inbox juridico" || n === "inbox jurídico") return "bg-yellow-500/10 dark:bg-yellow-500/15";
  if (n === "em andamento") return "bg-red-500/10 dark:bg-red-500/15";
  if (n === "revisao" || n === "revisão") return "bg-blue-500/10 dark:bg-blue-500/15";
  if (n === "concluido" || n === "concluído") return "bg-lime-500/10 dark:bg-lime-500/15";
  return "bg-muted/10";
}

function isCompletedStatus(statusName: string) {
  const n = statusName.trim().toLowerCase();
  return n === "concluido" || n === "concluído" || n === "done";
}

function priorityMeta(priority: "low" | "medium" | "high" | "urgent" | null) {
  if (priority === "urgent") return { label: "Urgente", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400", rank: 4 };
  if (priority === "high")   return { label: "Alta",    tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400", rank: 3 };
  if (priority === "medium") return { label: "Média",   tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400", rank: 2 };
  if (priority === "low")    return { label: "Baixa",   tone: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400", rank: 1 };
  return { label: "Sem prioridade", tone: "bg-muted text-muted-foreground", rank: 0 };
}

function sourceTypeLabel(sourceType: "manual" | "email" | "dje" | "portal") {
  if (sourceType === "email") return "E-mail";
  if (sourceType === "dje")   return "DJE";
  if (sourceType === "portal") return "Portal";
  return "Manual";
}

function dueDateLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function assigneeFallback(assigneeUserId: string | null) {
  if (!assigneeUserId) return "--";
  return assigneeUserId.replace(/-/g, "").slice(0, 2).toUpperCase();
}

function sortTasks(tasks: WorkspaceTask[], sort: StatusSort): WorkspaceTask[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    if (sort.field === "title")
      return a.title.localeCompare(b.title, "pt-BR") * dir;
    if (sort.field === "assignee") {
      const av = a.assigneeUserId ?? "";
      const bv = b.assigneeUserId ?? "";
      return av.localeCompare(bv) * dir;
    }
    if (sort.field === "date") {
      const am = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bm = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return (am - bm) * dir;
    }
    if (sort.field === "priority")
      return (priorityMeta(a.priority).rank - priorityMeta(b.priority).rank) * dir;
    if (sort.field === "tag")
      return sourceTypeLabel(a.sourceType).localeCompare(sourceTypeLabel(b.sourceType), "pt-BR") * dir;
    return 0;
  });
}

function SortIcon({ field, sort }: { field: ColField; sort: StatusSort }) {
  const active = sort.field === field;
  if (!active) return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />;
  if (sort.direction === "asc") return <ChevronUp className="size-3.5 text-blue-500" />;
  return <ChevronDown className="size-3.5 text-blue-500" />;
}

type WorkspaceTaskPanelProps = {
  overview: WorkspaceTaskOverview[];
};

export function WorkspaceTaskPanel({ overview }: WorkspaceTaskPanelProps) {
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());
  const [statusSorts, setStatusSorts] = useState<Record<string, StatusSort>>({});

  function getSort(statusId: string): StatusSort {
    return statusSorts[statusId] ?? { field: "date", direction: "asc" };
  }

  function handleColSort(statusId: string, field: ColField) {
    setStatusSorts((prev) => {
      const cur = prev[statusId] ?? { field: "date", direction: "asc" };
      const next: StatusSort =
        cur.field === field
          ? { field, direction: cur.direction === "asc" ? "desc" : "asc" }
          : { field, direction: "asc" };
      return { ...prev, [statusId]: next };
    });
  }

  function toggleStatus(statusId: string) {
    setCollapsedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  }

  const computed = useMemo(
    () =>
      overview.map((workspace) => {
        const activeStatuses = workspace.statuses.filter((s) => !isCompletedStatus(s.name));
        const activeTasksCount = activeStatuses.reduce((sum, s) => sum + s.tasks.length, 0);
        return { ...workspace, activeStatuses, activeTasksCount };
      }),
    [overview]
  );

  const colHeader = (statusId: string, field: ColField, label: string) => {
    const sort = getSort(statusId);
    const active = sort.field === field;
    return (
      <span className="inline-flex items-center gap-1">
        {label}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleColSort(statusId, field);
          }}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
            active ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" : "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
          )}
          aria-label={`Ordenar por ${label}`}
        >
          <SortIcon field={field} sort={sort} />
        </button>
      </span>
    );
  };

  return (
    <Card className="border-muted">
      {computed.map((workspace) => (
        <div key={workspace.workspaceId} className="flex flex-col">
          {/* Workspace header */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg bg-muted/30 px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold">{workspace.workspaceName}</h2>
              <p className="text-sm text-muted-foreground">
                {workspace.activeTasksCount} {workspace.activeTasksCount === 1 ? "tarefa" : "tarefas"} em {workspace.statuses.length} status
              </p>
            </div>
            {workspace.defaultBoardId ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/boards/${workspace.defaultBoardId}`}>
                    <SquareArrowOutUpRight className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Abrir board</TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          {workspace.activeStatuses.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa ativa para este workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {workspace.activeStatuses
                .filter((status) => status.tasks.length > 0)
                .map((status) => {
                  const isCollapsed = collapsedStatuses.has(status.id);
                  const sort = getSort(status.id);
                  const sortedTasks = sortTasks(status.tasks, sort);

                  return (
                    <div key={status.id} className="flex flex-col">
                      {/* Status header (collapsible) */}
                      <button
                        type="button"
                        onClick={() => toggleStatus(status.id)}
                        className="flex w-full items-center gap-2 border-b border-border bg-muted/10 px-4 py-2.5 text-left hover:bg-muted/20"
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center transition-transform",
                            isCollapsed ? "rotate-0" : "rotate-90"
                          )}
                        >
                          <ChevronRight className="size-4" />
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("rounded-full w-fit text-sm font-normal border-none px-2 py-1", listTone(status.name))}
                        >
                          {status.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{status.tasks.length}</span>
                      </button>

                      {!isCollapsed && (
                        <div className="min-w-[720px] border-b-4 border-border border-background">
                          {/* Column headers with per-column sort */}
                          <div className="grid grid-cols-[minmax(0,1.6fr)_140px_120px_130px_100px_80px] border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {colHeader(status.id, "title", "Nome")}
                            {colHeader(status.id, "assignee", "Responsável")}
                            {colHeader(status.id, "date", "Data")}
                            {colHeader(status.id, "priority", "Prioridade")}
                            {colHeader(status.id, "tag", "Tag")}
                            <span className="text-right">Ação</span>
                          </div>

                          {sortedTasks.map((task) => {
                            const priority = priorityMeta(task.priority);
                            return (
                              <div
                                key={task.id}
                                className="grid grid-cols-[minmax(0,1.6fr)_140px_120px_130px_100px_80px] items-center gap-2 border-b border-border px-4 py-2.5 text-sm last:border-b-0 hover:bg-muted/10"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className={cn("size-2 shrink-0 rounded-full", statusDotClass(status.name))} />
                                  <span className="truncate font-medium">{task.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Avatar className="size-6">
                                    <AvatarFallback className="text-[10px]">
                                      {assigneeFallback(task.assigneeUserId)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-xs">
                                    {task.assigneeUserId ? "Responsável" : "Sem responsável"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  {task.dueDate ? (
                                    <>
                                      <Calendar className="size-3.5 shrink-0" />
                                      {dueDateLabel(task.dueDate)}
                                    </>
                                  ) : (
                                    <>
                                      <Calendar className="size-3.5 shrink-0 opacity-50" />
                                      —
                                    </>
                                  )}
                                </div>
                                <div>
                                  <Badge variant="outline" className={cn("text-xs", priority.tone)}>
                                    {task.priority ? <Flag className="mr-1 size-3" /> : null}
                                    {priority.label}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="w-fit text-xs">
                                  {sourceTypeLabel(task.sourceType)}
                                </Badge>
                                <div className="text-right">
                                  <Link
                                    href={`/boards/${task.boardId}`}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    Abrir
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          <div className="px-4 py-2">
                            <AddTaskDialog
                              boardId={status.boardId}
                              listId={status.id}
                              listName={status.name}
                              listTone={listTone(status.name)}
                              trigger={
                                <Button variant="ghost" className="justify-start text-muted-foreground" type="button">
                                  + Adicionar tarefa
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
