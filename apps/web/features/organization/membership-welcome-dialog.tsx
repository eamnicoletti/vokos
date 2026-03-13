"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MembershipWelcomeDialogProps = {
  organizationName: string;
  boardId?: string;
};

export function MembershipWelcomeDialog({ organizationName, boardId }: MembershipWelcomeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function closeDialog() {
    setOpen(false);
    router.replace("/workspace");
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agora você faz parte de {organizationName}</DialogTitle>
          <DialogDescription>
            Sua organização já está pronta para colaborar. Entre nos boards, acompanhe as tarefas do time e comece a trabalhar com contexto compartilhado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Ver minhas tarefas
          </Button>
          {boardId ? (
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                router.replace(`/boards/${boardId}`);
              }}
            >
              Abrir workspace
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
