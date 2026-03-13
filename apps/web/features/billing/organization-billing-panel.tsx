import { AlertCircle, CalendarClock, CreditCard, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { OrganizationBillingSummary } from "@/lib/db/billing";
import { OpenBillingPortalButton } from "@/features/billing/open-billing-portal-button";

function formatCurrencyBRL(amountInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(amountInCents / 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Ainda nao definido";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function getStatusBadge(summary: OrganizationBillingSummary) {
  if (summary.subscriptionStatus === "trialing") {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Teste grátis ativo</Badge>;
  }

  if (summary.subscriptionStatus === "active") {
    return <Badge className="bg-foreground text-background hover:bg-foreground">Assinatura ativa</Badge>;
  }

  if (summary.subscriptionStatus === "past_due") {
    return <Badge variant="destructive">Pagamento pendente</Badge>;
  }

  if (summary.subscriptionStatus === "canceled") {
    return <Badge variant="outline">Assinatura cancelada</Badge>;
  }

  return <Badge variant="secondary">{summary.subscriptionStatus}</Badge>;
}

export function OrganizationBillingPanel({ summary }: { summary: OrganizationBillingSummary }) {
  const isTrialing = summary.subscriptionStatus === "trialing";
  const isPastDue = summary.subscriptionStatus === "past_due";
  const isCanceled = summary.cancelAtPeriodEnd || summary.subscriptionStatus === "canceled";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Assinatura da organização</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{summary.organizationName}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Esta tela gerencia apenas a assinatura desta organização. Se você administra outras organizações, cada uma tem a
            própria assinatura e o próprio portal de gestão.
          </p>
        </div>
        {summary.canManage ? (
          <OpenBillingPortalButton organizationId={summary.organizationId} returnPath="/organization/billing" />
        ) : null}
      </div>

      {!summary.canManage ? (
        <Alert>
          <ShieldAlert className="size-4" />
          <AlertTitle>Acesso somente para o proprietário</AlertTitle>
          <AlertDescription>
            Você pode visualizar o status atual da assinatura, mas apenas o owner desta organização pode alterar plano,
            pagamento ou cancelamento no Stripe.
          </AlertDescription>
        </Alert>
      ) : null}

      {isTrialing ? (
        <Alert>
          <CalendarClock className="size-4" />
          <AlertTitle>Teste grátis em andamento</AlertTitle>
          <AlertDescription>
            A cobrança automática desta organização está prevista para <strong>{formatDate(summary.currentPeriodEnd)}</strong>.
          </AlertDescription>
        </Alert>
      ) : null}

      {isPastDue ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Cobrança pendente</AlertTitle>
          <AlertDescription>
            O Stripe marcou esta assinatura com pagamento pendente. Recomendamos abrir o portal de cobrança para revisar o
            metodo de pagamento o quanto antes.
          </AlertDescription>
        </Alert>
      ) : null}

      {isCanceled ? (
        <Alert>
          <CreditCard className="size-4" />
          <AlertTitle>Cancelamento agendado ou concluído</AlertTitle>
          <AlertDescription>
            {summary.subscriptionStatus === "canceled"
              ? "Esta assinatura foi cancelada no Stripe."
              : `A assinatura permanece ativa até ${formatDate(summary.currentPeriodEnd)} e depois será encerrada.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plano atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold text-foreground">{summary.planLabel}</div>
            <p className="text-sm text-muted-foreground">{summary.priceLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getStatusBadge(summary)}
            <p className="text-sm text-muted-foreground">Atualizado automaticamente via webhook do Stripe.</p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isTrialing ? "Fim do teste" : "Próxima cobrança"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold text-foreground">{formatDate(summary.currentPeriodEnd)}</div>
            <p className="text-sm text-muted-foreground">
              Valor de referência: {formatCurrencyBRL(summary.monthlyPriceInCents)} por ciclo.
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ciclo atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              {formatDate(summary.currentPeriodStart)} até {formatDate(summary.currentPeriodEnd)}
            </div>
            <p className="text-sm text-muted-foreground">
              As mudanças de plano, pagamento e cancelamento acontecem diretamente no portal seguro do Stripe.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
