"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { saveOrganizationSetupDraftAction } from "@/app/organization/setup/actions";
import type { OrganizationPlanCode } from "@/lib/auth";
import type { OrganizationSetupDraft } from "@/lib/db/organizations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrganizationSetupShell } from "@/features/organization/organization-setup-shell";

type OrganizationSetupNameStepProps = {
  draft: OrganizationSetupDraft | null;
  userEmail: string;
};

export function OrganizationSetupNameStep({ draft, userEmail }: OrganizationSetupNameStepProps) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState(draft?.organizationName ?? "");
  const [isPending, startTransition] = useTransition();
  const canSubmit = organizationName.trim().length >= 3;
  const selectedPlan = (draft?.planCode ?? "equipe") as OrganizationPlanCode;

  function handleContinue() {
    if (!canSubmit) {
      toast.error("Informe o nome da organizacao antes de continuar.");
      return;
    }

    startTransition(async () => {
      const request = saveOrganizationSetupDraftAction({
        organizationName,
        planCode: selectedPlan
      });

      toast.promise(request, {
        loading: "Salvando rascunho...",
        success: "Organizacao salva. Agora escolha o plano.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao salvar a organizacao")
      });

      try {
        await request;
        router.push("/organization/setup/plan" as Route);
        router.refresh();
      } catch {
        // Toast handles feedback.
      }
    });
  }

  return (
    <OrganizationSetupShell
      userEmail={userEmail}
      eyebrow="etapa 1 de 2"
      title="Primeiro, defina o nome da sua organização."
      description="Quando você avançar, esse nome fica salvo como rascunho e a etapa seguinte passa a cuidar do plano e da ativação."
    >
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/85 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
            <div className="min-w-0 space-y-8 p-6 sm:p-8 lg:pr-8">
              <div className="max-w-3xl space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Building2 className="size-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Identidade</p>
                    <h2 className="text-2xl font-semibold">Cadastre seu escritório</h2>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Use o nome real da organização. Esse nome será usado para identificar sua organização pelos seus colaboradores.
                </p>
              </div>

              <div className="max-w-xl space-y-3">
                <label htmlFor="organization-name" className="text-sm font-medium text-slate-700 dark:text-slate-100">
                  Nome da organização
                </label>
                <Input
                  id="organization-name"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="Ex.: Faria Silva Advogados"
                  className="h-12 rounded-lg border-slate-300/80 bg-white/90 text-base shadow-none dark:border-white/10 dark:bg-white/5"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ao continuar, salvamos esse nome como rascunho e abrimos a etapa de escolha do plano.
                </p>
              </div>

              <div className="max-w-xl">
                <Button
                  type="button"
                  className="h-11 w-full rounded-lg bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  disabled={isPending}
                  onClick={handleContinue}
                >
                  {isPending ? "Continuando..." : "Continuar para o plano"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative hidden overflow-hidden lg:block lg:min-h-[460px]">
              <Image
                src="/images/lawyers_in_the_office.webp"
                alt="Advogado trabalhando em ambiente de escritorio"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="scale-110 object-cover object-center"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </OrganizationSetupShell>
  );
}
