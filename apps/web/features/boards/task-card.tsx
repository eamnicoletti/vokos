"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, CirclePlus, Flag, MoreHorizontal, Paperclip, Pencil, SquarePen, Tag, UserPlus, Users, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { BoardSnapshot } from "@/lib/db/boards";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Task = BoardSnapshot["lists"][number]["tasks"][number];
type TaskPriority = Task["priority"];

type TaskCardProps = {
  task: Task;
  currentListId: string;
  completedListId: string | null;
  listOptions: Array<{ id: string; name: string }>;
  mutationPending: boolean;
  isDragging?: boolean;
  onMove: (taskId: string, targetListId: string) => void;
  onUpdateTask: (taskId: string, patch: { title?: string; description?: string; dueDate?: string | null; priority?: TaskPriority }) => void;
  onAddComment: (taskId: string, body: string) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: () => void;
};

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string; tone: string }> = [
  { value: "low", label: "Baixa", tone: "bg-slate-100 text-slate-700" },
  { value: "medium", label: "Media", tone: "bg-sky-100 text-sky-700" },
  { value: "high", label: "Alta", tone: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgente", tone: "bg-rose-100 text-rose-700" }
];

function findPriorityLabel(value: TaskPriority) {
  return PRIORITY_OPTIONS.find((option) => option.value === value) ?? null;
}

function shortDateLabel(value: Date | undefined) {
  if (!value) return "Sem data";
  return format(value, "dd/MM");
}

function TooltipIconButton({
  label,
  onClick,
  children,
  className,
  iconOnly
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`h-7 gap-2 rounded-md px-2 text-xs ${iconOnly ? "w-7 justify-center px-0" : ""} ${className ?? ""}`}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function TaskCard({
  task,
  currentListId,
  completedListId,
  listOptions,
  mutationPending,
  isDragging,
  onMove,
  onUpdateTask,
  onAddComment,
  onDragStart,
  onDragEnd
}: TaskCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inlineEditTitle, setInlineEditTitle] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [tag, setTag] = useState<string>(task.source_type);
  const [commentDraft, setCommentDraft] = useState("");
  const [assignees, setAssignees] = useState<string[]>(["Membro"]);

  useEffect(() => {
    setInlineTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setPriority(task.priority);
    setTag(task.source_type);
  }, [task]);

  const priorityView = useMemo(() => findPriorityLabel(priority), [priority]);
  const isCompleted = completedListId === currentListId;

  function stopAndRun(event: React.MouseEvent<HTMLButtonElement>, callback: () => void) {
    event.preventDefault();
    event.stopPropagation();
    callback();
  }

  function commitInlineTitle() {
    const next = inlineTitle.trim();
    if (next.length < 3 || next === task.title) {
      setInlineTitle(task.title);
      setInlineEditTitle(false);
      return;
    }

    onUpdateTask(task.id, { title: next });
    setInlineEditTitle(false);
  }

  function updateDueDate(nextDate: Date | undefined) {
    setDueDate(nextDate);
    onUpdateTask(task.id, { dueDate: nextDate ? nextDate.toISOString() : null });
  }

  function updatePriority(nextPriority: TaskPriority) {
    setPriority(nextPriority);
    onUpdateTask(task.id, { priority: nextPriority });
  }

  function submitComment() {
    const value = commentDraft.trim();
    if (!value) return;
    onAddComment(task.id, value);
    setCommentDraft("");
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Card
          data-task-id={task.id}
          className={`border-border shadow-sm transition-colors hover:border-primary/40 ${isDragging ? "opacity-30" : ""}`}
          draggable
          onDragStart={(event) => onDragStart(event, task.id)}
          onDragEnd={onDragEnd}
          onClick={() => setDetailsOpen(true)}
        >
          <CardContent className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {inlineEditTitle ? (
                  <Input
                    autoFocus
                    value={inlineTitle}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setInlineTitle(event.target.value)}
                    onBlur={commitInlineTitle}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitInlineTitle();
                      }
                    }}
                  />
                ) : (
                  <p className="text-sm font-medium">{task.title}</p>
                )}
              </div>
              <div className="group relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
                <div className="pointer-events-none absolute right-0 top-0 z-30 flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <TooltipIconButton
                    label="Concluir tarefa"
                    onClick={(event) =>
                      stopAndRun(event, () => {
                        if (!completedListId || isCompleted) return;
                        onMove(task.id, completedListId);
                      })
                    }
                    className={isCompleted ? "text-emerald-600" : "" + "border-none shadow-none"}
                  >
                    <Check className="size-4" />
                  </TooltipIconButton>
                  <TooltipIconButton
                    label="Adicionar subtask"
                    onClick={(event) => stopAndRun(event, () => toast.info("Subtasks detalhadas sao M1 TODO de banco"))}
                    className="border-none shadow-none"
                  >
                    <CirclePlus className="size-4" />
                  </TooltipIconButton>
                  <TooltipIconButton
                    label="Renomear rapidamente"
                    onClick={(event) => stopAndRun(event, () => setInlineEditTitle(true))}
                    className="border-none shadow-none"
                  >
                    <Pencil className="size-4" />
                  </TooltipIconButton>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="text-[10px]">RM</AvatarFallback>
              </Avatar>

              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    label={dueDate ? "Editar data" : "Definir data"}
                    iconOnly={!dueDate}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <CalendarIcon className={dueDate ? "size-3.5" : "size-4"} />
                    {dueDate ? shortDateLabel(dueDate) : null}
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={updateDueDate} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    label={priorityView ? "Editar prioridade" : "Definir prioridade"}
                    iconOnly={!priorityView}
                    className={priorityView ? priorityView.tone : undefined}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Flag className={priorityView ? "size-3.5" : "size-4"} />
                    {priorityView ? priorityView.label : null}
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-2" align="start">
                  <div className="grid gap-1">
                    {PRIORITY_OPTIONS.map((option) => (
                      <Button key={option.label} variant="ghost" className="justify-start" onClick={() => updatePriority(option.value)}>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    label={tag ? "Editar tag" : "Definir tag"}
                    iconOnly={!tag}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Tag className={tag ? "size-3.5" : "size-4"} />
                    {tag || null}
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" align="start">
                  <div className="grid gap-1">
                    {["manual", "email", "dje", "portal", "infra", "design"].map((option) => (
                      <Button key={option} variant="ghost" className="justify-start" onClick={() => setTag(option)}>
                        {option}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              <Input value={inlineTitle} onChange={(event) => setInlineTitle(event.target.value)} />
            </DialogTitle>
            <DialogDescription>Edite a tarefa e metadados. Campos sem suporte de banco estao mockados com TODO.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm font-medium">Status</p>
              <div className="flex flex-wrap gap-2">
                {listOptions.map((option) => (
                  <Button key={option.id} variant="outline" size="sm" onClick={() => onMove(task.id, option.id)}>
                    {option.name}
                  </Button>
                ))}
              </div>

              <p className="text-sm font-medium">Datas</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 size-4" />
                    {shortDateLabel(dueDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={updateDueDate} />
                </PopoverContent>
              </Popover>

              <p className="text-sm font-medium">Descricao</p>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Adicione a descricao da tarefa..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Assignees</p>
              <div className="flex items-center gap-2">
                {assignees.map((member, index) => (
                  <Avatar key={`${member}-${index}`} className="size-7">
                    <AvatarFallback className="text-[10px]">{member.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO(M1 DB): support multi-assignee relation table for tasks.
                    setAssignees((prev) => [...prev, `M${prev.length + 1}`]);
                  }}
                >
                  <UserPlus className="mr-1 size-4" />
                  Add member
                </Button>
              </div>

              <p className="text-sm font-medium">Prioridade</p>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <Button key={option.label} variant="outline" size="sm" onClick={() => updatePriority(option.value)}>
                    {option.label}
                  </Button>
                ))}
              </div>

              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {["manual", "email", "dje", "portal", "infra", "design"].map((option) => (
                  <Button
                    key={option}
                    variant={tag === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      // TODO(M1 DB): support dedicated tags table and task_tags relation.
                      setTag(option);
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Button variant="ghost" className="justify-start" onClick={() => toast.info("Add fields: TODO M1 DB")}>
              <SquarePen className="mr-2 size-4" />
              Add fields
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => toast.info("Add subtask: TODO M1 DB")}>
              <CirclePlus className="mr-2 size-4" />
              Add subtask
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => toast.info("Create checklist: TODO M1 DB")}>
              <ListChecks className="mr-2 size-4" />
              Create checklist
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => toast.info("Attach file: TODO M1 storage integration")}>
              <Paperclip className="mr-2 size-4" />
              Attach file
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => toast.info("Assignee workflows: TODO M1 DB")}>
              <Users className="mr-2 size-4" />
              Manage assignees
            </Button>
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Comentários</p>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Escreva um comentário..."
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
            />
            <Button onClick={submitComment} disabled={mutationPending || !commentDraft.trim()}>
              Adicionar comentário
            </Button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                onUpdateTask(task.id, {
                  title: inlineTitle,
                  description,
                  dueDate: dueDate ? dueDate.toISOString() : null,
                  priority
                });
                setDetailsOpen(false);
              }}
              disabled={mutationPending || inlineTitle.trim().length < 3}
            >
              {mutationPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
