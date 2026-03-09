"use client";

import { ChevronLeft, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import type { BoardSnapshot } from "@/lib/db/boards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskCard } from "@/features/boards/task-card";

type List = BoardSnapshot["lists"][number];
type TaskPriority = BoardSnapshot["lists"][number]["tasks"][number]["priority"];

type ListCardProps = {
  list: List;
  listOptions: Array<{ id: string; name: string }>;
  completedListId: string | null;
  isDropTarget: boolean;
  isCollapsed: boolean;
  createPending: boolean;
  mutationPending: boolean;
  addTaskListId: string | null;
  addTaskTitle: string;
  addTaskDescription: string;
  onToggleList: (listId: string) => void;
  onOpenAddTask: (listId: string) => void;
  onCloseAddTask: () => void;
  onAddTaskTitleChange: (value: string) => void;
  onAddTaskDescriptionChange: (value: string) => void;
  onSubmitAddTask: () => void;
  onOpenRenameList: (listId: string, currentName: string) => void;
  onMoveTask: (taskId: string, targetListId: string) => void;
  onUpdateTask: (taskId: string, patch: { title?: string; description?: string; dueDate?: string | null; priority?: TaskPriority }) => void;
  onAddComment: (taskId: string, body: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
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

export function ListCard({
  list,
  listOptions,
  completedListId,
  isDropTarget,
  isCollapsed,
  createPending,
  mutationPending,
  addTaskListId,
  addTaskTitle,
  addTaskDescription,
  onToggleList,
  onOpenAddTask,
  onCloseAddTask,
  onAddTaskTitleChange,
  onAddTaskDescriptionChange,
  onSubmitAddTask,
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
  const listName = list.name.trim().toLowerCase();
  const listTone =
    listName === "inbox juridico" || listName === "inbox jurídico"
      ? "bg-yellow-500/15 text-yellow-800"
      : listName === "em andamento"
        ? "bg-red-500/15 text-red-800"
        : listName === "revisao" || listName === "revisão"
          ? "bg-blue-500/15 text-blue-800"
          : listName === "concluido" || listName === "concluído"
            ? "bg-lime-500/15 text-lime-800"
            : "bg-card";

  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={`transition-colors ${isDropTarget ? "border-primary" : "border-border"} border-muted`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              <Badge variant="outline" className={`${listTone} rounded-full px-2 py-1 text-sm font-normal`}>
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

              <Dialog
                open={addTaskListId === list.id}
                onOpenChange={(open) => {
                  if (open) {
                    onOpenAddTask(list.id);
                  } else if (addTaskListId === list.id) {
                    onCloseAddTask();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <span>
                    <TooltipIconButton label="Adicionar tarefa" onClick={() => undefined}>
                      <Plus className="size-4" />
                    </TooltipIconButton>
                  </span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Adicionar tarefa</DialogTitle>
                    <DialogDescription>
                      Lista: 
                      <Badge variant="outline" className={`${listTone} rounded-md text-base`}>{list.name}</Badge>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input value={addTaskTitle} onChange={(event) => onAddTaskTitleChange(event.target.value)} placeholder="Título" />
                    <textarea
                      className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Descrição (opcional)"
                      value={addTaskDescription}
                      onChange={(event) => onAddTaskDescriptionChange(event.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="button" disabled={createPending || addTaskTitle.trim().length < 3} onClick={onSubmitAddTask}>
                      {createPending ? "Criando..." : "Criar tarefa"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`space-y-3 ${isCollapsed ? "hidden" : ""}`}>
          {list.tasks.length === 0 ? <p className="text-sm text-muted-foreground">Sem tarefas nesta coluna.</p> : null}
          {list.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentListId={list.id}
              completedListId={completedListId}
              listOptions={listOptions}
              mutationPending={mutationPending}
              onMove={onMoveTask}
              onUpdateTask={onUpdateTask}
              onAddComment={onAddComment}
              onDragStart={(event, taskId) => onTaskDragStart(event, taskId, list.id)}
              onDragEnd={onTaskDragEnd}
            />
          ))}

          <Dialog
            open={addTaskListId === list.id && !isCollapsed}
            onOpenChange={(open) => {
              if (open) {
                onOpenAddTask(list.id);
              } else if (addTaskListId === list.id) {
                onCloseAddTask();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" className="justify-start" type="button">
                + Adicionar tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar tarefa</DialogTitle>
                <DialogDescription>
                  Lista: 
                  <Badge variant="outline" className={`${listTone} rounded-md ml-2`}>{list.name}</Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input value={addTaskTitle} onChange={(event) => onAddTaskTitleChange(event.target.value)} placeholder="Titulo" />
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descricao (opcional)"
                  value={addTaskDescription}
                  onChange={(event) => onAddTaskDescriptionChange(event.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="button" disabled={createPending || addTaskTitle.trim().length < 3} onClick={onSubmitAddTask}>
                  {createPending ? "Criando..." : "Criar tarefa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
