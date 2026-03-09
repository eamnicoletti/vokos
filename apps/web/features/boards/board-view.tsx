"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BoardSnapshot } from "@/lib/db/boards";
import { addTaskCommentAction, createTaskAction, moveTaskAction, updateListNameAction, updateTaskAction } from "@/app/(app)/boards/[boardId]/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/features/boards/list-card";

type BoardViewProps = {
  snapshot: BoardSnapshot;
};

export function BoardView({ snapshot }: BoardViewProps) {
  const router = useRouter();
  const [createPending, setCreatePending] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);

  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragSourceListId, setDragSourceListId] = useState<string | null>(null);
  const [dropTargetListId, setDropTargetListId] = useState<string | null>(null);

  const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({});

  const [addTaskListId, setAddTaskListId] = useState<string | null>(null);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskDescription, setAddTaskDescription] = useState("");

  const [renameListId, setRenameListId] = useState<string | null>(null);
  const [renameListName, setRenameListName] = useState("");

  const listOptions = useMemo(() => snapshot.lists.map((list) => ({ id: list.id, name: list.name })), [snapshot.lists]);
  const completedListId = useMemo(
    () =>
      snapshot.lists.find((list) => {
        const name = list.name.trim().toLowerCase();
        return name === "concluido" || name === "concluído";
      })?.id ?? null,
    [snapshot.lists]
  );

  function handleOpenAddTask(listId: string) {
    setAddTaskListId(listId);
    setAddTaskTitle("");
    setAddTaskDescription("");
  }

  function handleAddTaskToList() {
    if (!addTaskListId || addTaskTitle.trim().length < 3 || createPending) {
      return;
    }

    setCreatePending(true);
    const request = createTaskAction({
      boardId: snapshot.id,
      listId: addTaskListId,
      title: addTaskTitle.trim(),
      description: addTaskDescription.trim() || undefined
    });

    toast.promise(request, {
      loading: "Criando tarefa...",
      success: "Tarefa criada.",
      error: (error) => (error instanceof Error ? error.message : "Falha ao criar tarefa")
    });

    void request
      .then(() => {
        setAddTaskListId(null);
        setAddTaskTitle("");
        setAddTaskDescription("");
        router.refresh();
      })
      .catch(() => {
        // Error feedback handled by toast.
      })
      .finally(() => setCreatePending(false));
  }

  function handleToggleList(listId: string) {
    setCollapsedLists((prev) => ({ ...prev, [listId]: !prev[listId] }));
  }

  function handleOpenRenameList(listId: string, currentName: string) {
    setRenameListId(listId);
    setRenameListName(currentName);
  }

  function handleRenameList() {
    if (!renameListId || renameListName.trim().length < 3 || mutationPending) {
      return;
    }

    setMutationPending(true);
    const request = updateListNameAction({
      boardId: snapshot.id,
      listId: renameListId,
      name: renameListName.trim()
    });

    toast.promise(request, {
      loading: "Renomeando lista...",
      success: "Lista renomeada.",
      error: (error) => (error instanceof Error ? error.message : "Falha ao renomear lista")
    });

    void request
      .then(() => {
        setRenameListId(null);
        setRenameListName("");
        router.refresh();
      })
      .catch(() => {
        // Error feedback handled by toast.
      })
      .finally(() => setMutationPending(false));
  }

  function handleMove(taskId: string, targetListId: string) {
    if (mutationPending) {
      return;
    }

    const currentList = snapshot.lists.find((list) => list.tasks.some((task) => task.id === taskId));
    if (!currentList || currentList.id === targetListId) {
      return;
    }

    setMutationPending(true);
    const request = moveTaskAction({
      boardId: snapshot.id,
      taskId,
      targetListId,
      position: Date.now()
    });

    toast.promise(request, {
      loading: "Movendo tarefa...",
      success: "Tarefa movida.",
      error: (error) => (error instanceof Error ? error.message : "Falha ao mover tarefa")
    });

    void request
      .then(() => router.refresh())
      .catch(() => {
        // Error feedback handled by toast.
      })
      .finally(() => setMutationPending(false));
  }

  function handleUpdateTask(
    taskId: string,
    patch: { title?: string; description?: string; dueDate?: string | null; priority?: "low" | "medium" | "high" | "urgent" | null }
  ) {
    if (mutationPending) {
      return;
    }

    setMutationPending(true);
    const request = updateTaskAction({
      boardId: snapshot.id,
      taskId,
      title: patch.title,
      description: patch.description,
      dueDate: patch.dueDate,
      priority: patch.priority
    });

    toast.promise(request, {
      loading: "Atualizando tarefa...",
      success: "Tarefa atualizada.",
      error: (error) => (error instanceof Error ? error.message : "Falha ao atualizar tarefa")
    });

    void request
      .then(() => router.refresh())
      .catch(() => {
        // Error feedback handled by toast.
      })
      .finally(() => setMutationPending(false));
  }

  function handleAddComment(taskId: string, body: string) {
    if (mutationPending) {
      return;
    }

    setMutationPending(true);
    const request = addTaskCommentAction({
      boardId: snapshot.id,
      taskId,
      body
    });

    toast.promise(request, {
      loading: "Salvando comentário...",
      success: "Comentário registrado.",
      error: (error) => (error instanceof Error ? error.message : "Falha ao salvar comentário")
    });

    void request
      .then(() => router.refresh())
      .catch(() => {
        // Error feedback handled by toast.
      })
      .finally(() => setMutationPending(false));
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, taskId: string, listId: string) {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
    setDragTaskId(taskId);
    setDragSourceListId(listId);
  }

  function handleDragEnd() {
    setDragTaskId(null);
    setDragSourceListId(null);
    setDropTargetListId(null);
  }

  function handleDrop(listId: string, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id") || dragTaskId;
    setDropTargetListId(null);
    setDragTaskId(null);
    const sourceListId = dragSourceListId;
    setDragSourceListId(null);

    if (!taskId || sourceListId === listId) {
      return;
    }
    handleMove(taskId, listId);
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6">
      <section className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.lists.map((list) => {
          const isDropTarget = dropTargetListId === list.id;
          const isCollapsed = collapsedLists[list.id];

          return (
            <ListCard
              key={list.id}
              list={list}
              listOptions={listOptions}
              completedListId={completedListId}
              isDropTarget={isDropTarget}
              isCollapsed={isCollapsed}
              createPending={createPending}
              mutationPending={mutationPending}
              addTaskListId={addTaskListId}
              addTaskTitle={addTaskTitle}
              addTaskDescription={addTaskDescription}
              onToggleList={handleToggleList}
              onOpenAddTask={handleOpenAddTask}
              onCloseAddTask={() => {
                setAddTaskListId(null);
                setAddTaskTitle("");
                setAddTaskDescription("");
              }}
              onAddTaskTitleChange={setAddTaskTitle}
              onAddTaskDescriptionChange={setAddTaskDescription}
              onSubmitAddTask={handleAddTaskToList}
              onOpenRenameList={handleOpenRenameList}
              onMoveTask={handleMove}
              onUpdateTask={handleUpdateTask}
              onAddComment={handleAddComment}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTargetListId(list.id);
              }}
              onDragLeave={() => setDropTargetListId((current) => (current === list.id ? null : current))}
              onDrop={(event) => handleDrop(list.id, event)}
              onTaskDragStart={handleDragStart}
              onTaskDragEnd={handleDragEnd}
            />
          );
        })}
      </section>

      <Dialog
        open={renameListId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameListId(null);
            setRenameListName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear grupo</DialogTitle>
            <DialogDescription>Atualize o nome da coluna.</DialogDescription>
          </DialogHeader>
          <Input value={renameListName} onChange={(event) => setRenameListName(event.target.value)} placeholder="Nome do grupo" />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" disabled={mutationPending || renameListName.trim().length < 3} onClick={handleRenameList}>
              {mutationPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
