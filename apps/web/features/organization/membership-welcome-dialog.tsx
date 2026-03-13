"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Users } from "lucide-react";
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
      <DialogContent className="overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 sm:max-w-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <DialogHeader className="relative space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">Você agora faz parte de {organizationName}</DialogTitle>
            <DialogDescription className="text-base leading-7">
              Seu acesso foi liberado com sucesso. A partir de agora, você pode acompanhar o trabalho do time, colaborar
              nos boards e manter tudo centralizado no mesmo fluxo da organização.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="relative rounded-2xl border border-primary/10 bg-background/80 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="size-4 text-primary" />
            Bem-vindo ao time
          </div>
          <p>
            Comece pelo workspace principal para ver as tarefas compartilhadas, os responsáveis e o contexto que a equipe
            já construiu.
          </p>
        </div>
        <DialogFooter className="relative">
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
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
