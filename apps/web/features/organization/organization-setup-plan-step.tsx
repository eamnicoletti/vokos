"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CreditCard, Layers3, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { startOrganizationCheckoutAction } from "@/app/organization/setup/actions";
import type { OrganizationPlanCode } from "@/lib/auth";
import type { OrganizationSetupDraft } from "@/lib/db/organizations";
import { APP_PLANS } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OrganizationSetupShell } from "@/features/organization/organization-setup-shell";

type OrganizationSetupPlanStepProps = {
  draft: OrganizationSetupDraft;
  userEmail: string;
  isEligibleForTrial: boolean;
  stripeReady: boolean;
};

type PlanOption = {
  code: OrganizationPlanCode;
  label: string;
  originalPrice: string;
  priceLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
  accent: string;
  icon: typeof Layers3;
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    ...APP_PLANS[0],
    accent: "from-amber-300 via-orange-300 to-rose-300",
    icon: Layers3
  },
  {
    ...APP_PLANS[1],
    accent: "from-sky-300 via-cyan-300 to-emerald-300",
    icon: Users
  },
  {
    ...APP_PLANS[2],
    accent: "from-fuchsia-300 via-violet-300 to-indigo-300",
    icon: ShieldCheck
  }
];

export function OrganizationSetupPlanStep({
  draft,
  userEmail,
  isEligibleForTrial,
  stripeReady
}: OrganizationSetupPlanStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<OrganizationPlanCode>(draft.planCode);
  const [pendingActivate, startActivateTransition] = useTransition();
  const activePlan = PLAN_OPTIONS.find((plan) => plan.code === selectedPlan) ?? PLAN_OPTIONS[1];

  function handleCheckout() {
    startActivateTransition(async () => {
      const request = startOrganizationCheckoutAction({
        organizationName: draft.organizationName,
        planCode: selectedPlan
      });

      toast.promise(request, {
        loading: "Preparando checkout...",
        success: "Checkout iniciado com sucesso.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao iniciar o checkout")
      });

      try {
        const result = await request;
        window.location.assign(result.checkoutUrl);
      } catch {
        // Toast handles feedback.
      }
    });
  }

  return (
    <OrganizationSetupShell
      userEmail={userEmail}
      eyebrow="etapa 2 de 2"
      title="Agora escolha o plano e conclua a ativação."
      description="Escritório cadastrado! Falta apenas definir o plano para começar a automatizar suas tarefas."
      aside={
        <section className="grid gap-4 md:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.code;

            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => setSelectedPlan(plan.code)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-0 text-left transition-all duration-200",
                  isSelected
                    ? "border-slate-950 shadow-[0_24px_64px_-36px_rgba(15,23,42,0.55)] dark:border-white"
                    : "border-slate-200/80 hover:-translate-y-1 hover:border-slate-400/80 dark:border-white/10 dark:hover:border-white/30"
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", plan.accent)} />
                <div className="flex h-full flex-col justify-between gap-8 bg-white/90 p-6 dark:bg-white/5">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("rounded-xl bg-gradient-to-br p-3 text-slate-950", plan.accent)}>
                        <Icon className="size-5" />
                      </div>
                      {isSelected ? (
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          <Check className="size-4" />
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold">{plan.label}</h3>
                        <Badge variant="outline" className="rounded-full border-slate-300/80 bg-white/80 dark:border-white/15 dark:bg-white/5">
                          {plan.popular ? "Popular" : "Plano"}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-400 line-through dark:text-slate-500">{plan.originalPrice}</span>
                        <span className="text-2xl font-semibold">{plan.priceLabel}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-slate-950 dark:bg-white" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      }
    >
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/85 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">
                {draft.organizationName}
              </div>
              <Link href={"/organization/setup?edit=1" as Route} className="text-sm text-slate-500 underline-offset-4 hover:underline dark:text-slate-300">
                Alterar nome
              </Link>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Selecione ao lado o plano que melhor se adapta a <span className="font-medium">{draft.organizationName}</span>. Você pode cancelar ou fazer o upgrade da sua assinatura a qualquer momento.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">status atual</p>
                <p className="mt-2 text-lg font-semibold">Pronto para ativação</p>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-950 px-3 py-1 text-white dark:bg-white dark:text-slate-950"
              >
                {isEligibleForTrial ? "30 dias grátis" : "aguardando assinatura"}
              </Badge>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-4 text-emerald-500" />
                <span>Ao concluir o checkout no Stripe, a organizacao passa para ativa e voce libera o acesso ao sistema.</span>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 size-4 text-sky-500" />
                <span>
                  {isEligibleForTrial
                    ? "Como este e o seu primeiro plano, o checkout pode iniciar com 30 dias de teste gratis no Stripe."
                    : `Ao prosseguir, voce segue para o checkout do plano ${activePlan.label}.`}
                </span>
              </div>
              {!stripeReady ? (
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 size-4 text-amber-500" />
                  <span>Stripe sandbox ainda nao configurado neste ambiente. O rascunho continua salvo, mas o checkout fica bloqueado ate configurar as chaves e os price IDs.</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild type="button" variant="outline" className="h-11 flex-1 rounded-lg">
              <Link href={"/organization/setup?edit=1" as Route}>
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-lg bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              disabled={pendingActivate || !stripeReady}
              onClick={handleCheckout}
            >
              {pendingActivate ? "Processando..." : isEligibleForTrial ? "Iniciar teste gratis" : `Ir para o pagamento`}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </OrganizationSetupShell>
  );
}
