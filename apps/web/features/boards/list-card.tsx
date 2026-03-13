"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import type { BoardSnapshot } from "@/lib/db/boards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddTaskDialog } from "@/features/boards/add-task-dialog";
import { TaskCard } from "@/features/boards/task-card";

type List = BoardSnapshot["lists"][number];
type TaskPriority = BoardSnapshot["lists"][number]["tasks"][number]["priority"];

type ListCardProps = {
  boardId: string;
  list: List;
  listOptions: Array<{ id: string; name: string }>;
  completedListId: string | null;
  isDropTarget: boolean;
  isCollapsed: boolean;
  mutationPending: boolean;
  dragTaskId: string | null;
  dropInsertIndex: number | null;
  onToggleList: (listId: string) => void;
  onOpenRenameList: (listId: string, currentName: string) => void;
  onMoveTask: (taskId: string, targetListId: string) => void;
  onUpdateTask: (taskId: string, patch: { title?: string; description?: string; dueDate?: string | null; priority?: TaskPriority }) => void;
  onAddComment: (taskId: string, body: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, insertIndex: number | null) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onTaskDragStart: (event: React.DragEvent<HTMLDivElement>, taskId: string, listId: string) => void;
  onTaskDragEnd: () => void;
};

function TooltipIconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" type="button" onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DropPlaceholder() {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 transition-all mb-3" style={{ minHeight: 64 }} />
  );
}

export function ListCard({
  boardId,
  list,
  listOptions,
  completedListId,
  isDropTarget,
  isCollapsed,
  mutationPending,
  dragTaskId,
  dropInsertIndex,
  onToggleList,
  onOpenRenameList,
  onMoveTask,
  onUpdateTask,
  onAddComment,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskDragEnd
}: ListCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const computeInsertIndex = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const container = contentRef.current;
      if (!container) return null;

      const taskElements = Array.from(container.querySelectorAll<HTMLElement>("[data-task-id]"));
      if (taskElements.length === 0) return 0;

      for (let i = 0; i < taskElements.length; i++) {
        const rect = taskElements[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (event.clientY < midY) return i;
      }
      return taskElements.length;
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const idx = computeInsertIndex(event);
      onDragOver(event, idx);
    },
    [computeInsertIndex, onDragOver]
  );

  const listName = list.name.trim().toLowerCase();
  const listTone =
    listName === "inbox juridico" || listName === "inbox jurídico"
      ? "bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
      : listName === "em andamento"
        ? "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-400"
        : listName === "revisao" || listName === "revisão"
          ? "bg-blue-500/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
          : listName === "concluido" || listName === "concluído"
            ? "bg-lime-500/15 text-lime-800 dark:bg-lime-500/20 dark:text-lime-400"
            : "bg-muted text-muted-foreground";

  const showPlaceholder = isDropTarget && dragTaskId !== null;
  const effectiveInsertIndex = dropInsertIndex ?? list.tasks.length;

  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={`transition-colors ${isDropTarget ? "border-primary" : "border-border"} border-muted`}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              <Badge variant="outline" className={`${listTone} rounded-full px-2 py-1 text-sm font-normal border-none`}>
                {list.name}
              </Badge>
              <span className="ml-4 text-xs text-muted-foreground">{list.tasks.length}</span>
            </CardTitle>

            <div className="flex items-center gap-1">
              <TooltipIconButton label={isCollapsed ? "Expandir grupo" : "Recolher grupo"} onClick={() => onToggleList(list.id)}>
                <ChevronLeft className={`size-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"}`} />
              </TooltipIconButton>

              <Popover>
                <PopoverTrigger asChild>
                  <span>
                    <TooltipIconButton label="Mais opções" onClick={(event) => event.stopPropagation()}>
                      <MoreHorizontal className="size-4" />
                    </TooltipIconButton>
                  </span>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-2">
                  <div className="grid gap-1">
                    <Button variant="ghost" className="justify-start" type="button" onClick={() => onToggleList(list.id)}>
                      {isCollapsed ? "Expandir grupo" : "Recolher grupo"}
                    </Button>
                    <Button variant="ghost" className="justify-start" type="button" onClick={() => toast.info("Arquivar tudo desse grupo (M2)")}>
                      Arquivar tudo desse grupo
                    </Button>
                    <Button variant="ghost" className="justify-start" type="button" onClick={() => toast.info("Seleção de tarefas (M2)")}>
                      Selecionar tudo
                    </Button>
                    <Button variant="ghost" className="justify-start" type="button" onClick={() => onOpenRenameList(list.id, list.name)}>
                      Renomear grupo
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <AddTaskDialog
                boardId={boardId}
                listId={list.id}
                listName={list.name}
                listTone={listTone}
                trigger={
                  <span>
                    <TooltipIconButton label="Adicionar tarefa" onClick={() => undefined}>
                      <Plus className="size-4" />
                    </TooltipIconButton>
                  </span>
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent ref={contentRef} className={`space-y-3 ${isCollapsed ? "hidden" : ""}`}>
          {list.tasks.length === 0 && !showPlaceholder ? <p className="text-sm text-muted-foreground">Sem tarefas nesta coluna.</p> : null}

          {list.tasks.map((task, index) => (
            <div key={task.id}>
              {showPlaceholder && effectiveInsertIndex === index ? <DropPlaceholder /> : null}
              <TaskCard
                task={task}
                currentListId={list.id}
                completedListId={completedListId}
                listOptions={listOptions}
                mutationPending={mutationPending}
                isDragging={dragTaskId === task.id}
                onMove={onMoveTask}
                onUpdateTask={onUpdateTask}
                onAddComment={onAddComment}
                onDragStart={(event, taskId) => onTaskDragStart(event, taskId, list.id)}
                onDragEnd={onTaskDragEnd}
              />
            </div>
          ))}

          {showPlaceholder && effectiveInsertIndex >= list.tasks.length ? <DropPlaceholder /> : null}

          <AddTaskDialog
            boardId={boardId}
            listId={list.id}
            listName={list.name}
            listTone={listTone}
            trigger={
              <Button variant="ghost" className="justify-start" type="button">
                + Adicionar tarefa
              </Button>
            }
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
