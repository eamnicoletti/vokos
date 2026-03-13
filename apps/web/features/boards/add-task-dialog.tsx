"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTaskAction } from "@/app/(app)/boards/[boardId]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AddTaskDialogProps = {
  boardId: string;
  listId: string;
  listName: string;
  /** Classes para o Badge da lista (ex: listTone) */
  listTone?: string;
  /** Conteúdo que abre o dialog ao clicar (ex: botão "+ Adicionar tarefa") */
  trigger?: React.ReactNode;
  /** Controlado: se definido, open/onOpenChange controlam o dialog */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddTaskDialog({
  boardId,
  listId,
  listName,
  listTone = "bg-muted text-muted-foreground",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddTaskDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("");
      setDescription("");
    }
    setOpen(next);
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || pending) return;

    setPending(true);
    const request = createTaskAction({
      boardId,
      listId,
      title: trimmedTitle,
      description: description.trim() || undefined
    });

    toast.promise(request, {
      loading: "Criando tarefa...",
      success: "Tarefa criada.",
      error: (err) => (err instanceof Error ? err.message : "Falha ao criar tarefa")
    });

    request
      .then(() => {
        handleOpenChange(false);
        router.refresh();
      })
      .catch(() => {})
      .finally(() => setPending(false));
  }

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar tarefa</DialogTitle>
        <DialogDescription>
          Lista:{" "}
          <Badge variant="outline" className={cn("rounded-md", listTone)}>
            {listName}
          </Badge>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
        />
        <textarea
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={pending || title.trim().length < 3}
          onClick={handleSubmit}
        >
          {pending ? "Criando..." : "Criar tarefa"}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">{content}</DialogContent>
    </Dialog>
  );
}
