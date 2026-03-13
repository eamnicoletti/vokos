"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BoardSnapshot } from "@/lib/db/boards";
import { addTaskCommentAction, moveTaskAction, updateListNameAction, updateTaskAction } from "@/app/(app)/boards/[boardId]/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/features/boards/list-card";

type BoardViewProps = {
  snapshot: BoardSnapshot;
};

type TaskType = BoardSnapshot["lists"][number]["tasks"][number];

export function BoardView({ snapshot }: BoardViewProps) {
  const router = useRouter();
  const [mutationPending, setMutationPending] = useState(false);

  const [optimisticLists, setOptimisticLists] = useState(snapshot.lists);
  useEffect(() => {
    setOptimisticLists(snapshot.lists);
  }, [snapshot.lists]);

  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragSourceListId, setDragSourceListId] = useState<string | null>(null);
  const [dropTargetListId, setDropTargetListId] = useState<string | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);

  const [collapsedLists, setCollapsedLists] = useState<Record<string, boolean>>({});

  const [renameListId, setRenameListId] = useState<string | null>(null);
  const [renameListName, setRenameListName] = useState("");

  const draggedTaskRef = useRef<TaskType | null>(null);

  const listOptions = useMemo(() => optimisticLists.map((list) => ({ id: list.id, name: list.name })), [optimisticLists]);
  const completedListId = useMemo(
    () =>
      optimisticLists.find((list) => {
        const name = list.name.trim().toLowerCase();
        return name === "concluido" || name === "concluído";
      })?.id ?? null,
    [optimisticLists]
  );

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
      .catch(() => {})
      .finally(() => setMutationPending(false));
  }

  const applyOptimisticMove = useCallback(
    (taskId: string, sourceListId: string, targetListId: string, insertIndex?: number) => {
      setOptimisticLists((prev) => {
        const sourceList = prev.find((l) => l.id === sourceListId);
        if (!sourceList) return prev;
        const task = sourceList.tasks.find((t) => t.id === taskId);
        if (!task) return prev;

        return prev.map((list) => {
          if (list.id === sourceListId && list.id === targetListId) {
            const without = list.tasks.filter((t) => t.id !== taskId);
            const idx = insertIndex != null ? Math.min(insertIndex, without.length) : without.length;
            const reordered = [...without.slice(0, idx), task, ...without.slice(idx)];
            return { ...list, tasks: reordered };
          }
          if (list.id === sourceListId) {
            return { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) };
          }
          if (list.id === targetListId) {
            const idx = insertIndex != null ? Math.min(insertIndex, list.tasks.length) : list.tasks.length;
            const updated = [...list.tasks.slice(0, idx), task, ...list.tasks.slice(idx)];
            return { ...list, tasks: updated };
          }
          return list;
        });
      });
    },
    []
  );

  function handleMove(taskId: string, targetListId: string) {
    const currentList = optimisticLists.find((list) => list.tasks.some((task) => task.id === taskId));
    if (!currentList || currentList.id === targetListId) {
      return;
    }

    applyOptimisticMove(taskId, currentList.id, targetListId);

    void moveTaskAction({
      boardId: snapshot.id,
      taskId,
      targetListId,
      position: Date.now()
    })
      .then(() => router.refresh())
      .catch(() => {
        setOptimisticLists(snapshot.lists);
        toast.error("Falha ao mover tarefa. Revertendo.");
      });
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
      .catch(() => {})
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
      .catch(() => {})
      .finally(() => setMutationPending(false));
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, taskId: string, listId: string) {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
    setDragTaskId(taskId);
    setDragSourceListId(listId);

    const sourceList = optimisticLists.find((l) => l.id === listId);
    draggedTaskRef.current = sourceList?.tasks.find((t) => t.id === taskId) ?? null;
  }

  function handleDragEnd() {
    setDragTaskId(null);
    setDragSourceListId(null);
    setDropTargetListId(null);
    setDropInsertIndex(null);
    draggedTaskRef.current = null;
  }

  function handleDragOverList(listId: string, event: React.DragEvent<HTMLDivElement>, insertIndex: number | null) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetListId(listId);
    setDropInsertIndex(insertIndex);
  }

  function handleDrop(listId: string, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id") || dragTaskId;
    const sourceListId = dragSourceListId;
    const insertIdx = dropInsertIndex;

    setDropTargetListId(null);
    setDropInsertIndex(null);
    setDragTaskId(null);
    setDragSourceListId(null);
    draggedTaskRef.current = null;

    if (!taskId || !sourceListId) return;

    if (sourceListId === listId) {
      applyOptimisticMove(taskId, sourceListId, listId, insertIdx ?? undefined);
      return;
    }

    applyOptimisticMove(taskId, sourceListId, listId, insertIdx ?? undefined);

    void moveTaskAction({
      boardId: snapshot.id,
      taskId,
      targetListId: listId,
      position: Date.now()
    })
      .then(() => router.refresh())
      .catch(() => {
        setOptimisticLists(snapshot.lists);
        toast.error("Falha ao mover tarefa. Revertendo.");
      });
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6">
      <section className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {optimisticLists.map((list) => {
          const isDropTarget = dropTargetListId === list.id;
          const isCollapsed = collapsedLists[list.id];

          return (
            <ListCard
              key={list.id}
              boardId={snapshot.id}
              list={list}
              listOptions={listOptions}
              completedListId={completedListId}
              isDropTarget={isDropTarget}
              isCollapsed={isCollapsed}
              mutationPending={mutationPending}
              dragTaskId={dragTaskId}
              dropInsertIndex={isDropTarget ? dropInsertIndex : null}
              onToggleList={handleToggleList}
              onOpenRenameList={handleOpenRenameList}
              onMoveTask={handleMove}
              onUpdateTask={handleUpdateTask}
              onAddComment={handleAddComment}
              onDragOver={(event, insertIndex) => handleDragOverList(list.id, event, insertIndex)}
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
