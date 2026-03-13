"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationSetupShell } from "@/features/organization/organization-setup-shell";

type OrganizationSetupConfirmStepProps = {
  organizationName: string;
  userEmail: string;
};

export function OrganizationSetupConfirmStep({
  organizationName,
  userEmail
}: OrganizationSetupConfirmStepProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      startRefreshTransition(() => {
        router.refresh();
      });
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [router]);

  return (
    <OrganizationSetupShell
      userEmail={userEmail}
      eyebrow="checkout em andamento"
      title="Estamos confirmando sua assinatura no Stripe."
      description={`Assim que o webhook confirmar o pagamento do plano de ${organizationName}, sua organizacao sera ativada automaticamente.`}
    >
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/85 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Aguardando confirmacao do Stripe</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Se o pagamento ou o teste gratis ja foram concluídos no checkout, esta tela deve liberar seu acesso em alguns segundos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-11 flex-1 rounded-lg bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              disabled={isRefreshing}
              onClick={() => {
                startRefreshTransition(() => {
                  router.refresh();
                });
              }}
            >
              {isRefreshing ? "Verificando..." : "Verificar agora"}
            </Button>
            <Button asChild type="button" variant="outline" className="h-11 flex-1 rounded-lg">
              <Link href={"/organization/setup/plan" as Route}>Voltar para planos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </OrganizationSetupShell>
  );
}
