import { ReceiptText, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountBillingOverview } from "@/lib/db/billing";
import { OpenBillingPortalButton } from "@/features/billing/open-billing-portal-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function formatCurrencyBRL(amountInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(amountInCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "trialing") return "Teste gratis";
  if (status === "active") return "Ativa";
  if (status === "past_due") return "Pagamento pendente";
  if (status === "canceled") return "Cancelada";
  if (status === "unpaid") return "Nao paga";
  return "Incompleta";
}

export function AccountBillingPanel({ overview }: { overview: AccountBillingOverview }) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Cobranças da conta</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gastos e assinaturas</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Aqui você acompanha todas as assinaturas das organizações que administra. Cada organização continua tendo a própria
          assinatura e o próprio portal de gestão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gasto mensal recorrente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{formatCurrencyBRL(overview.totalMonthlySpendInCents)}</div>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas administradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{overview.organizations.length}</div>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{overview.invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {overview.organizations.map((organization) => (
          <Card key={organization.organizationId} className="border-muted">
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{organization.organizationName}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{organization.planLabel}</Badge>
                  <Badge variant="secondary">{getStatusLabel(organization.subscriptionStatus)}</Badge>
                </div>
              </div>
              <OpenBillingPortalButton organizationId={organization.organizationId} returnPath="/conta/cobrancas">
                Gerenciar assinatura
              </OpenBillingPortalButton>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <div className="font-medium text-foreground">Valor recorrente</div>
                <div>{formatCurrencyBRL(organization.monthlyPriceInCents)}</div>
              </div>
              <div>
                <div className="font-medium text-foreground">Próxima cobrança</div>
                <div>{organization.currentPeriodEnd ? formatDate(organization.currentPeriodEnd) : "Ainda nao definida"}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-muted">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <ReceiptText className="size-4" />
          </div>
          <div>
            <CardTitle>Faturas recentes</CardTitle>
            <p className="text-sm text-muted-foreground">Histórico consolidado das assinaturas que você administra.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {overview.invoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted px-4 py-6 text-sm text-muted-foreground">
              Nenhuma fatura encontrada ainda.
            </div>
          ) : (
            overview.invoices.map((invoice) => (
              <Card
                key={invoice.invoiceId}
                className="flex flex-col gap-3 rounded-xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{invoice.organizationName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(invoice.createdAt)} · {invoice.invoiceNumber ?? invoice.invoiceId}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{invoice.status ?? "sem status"}</Badge>
                  <div className="font-medium text-foreground">{formatCurrencyBRL(invoice.amountPaidInCents)}</div>
                  {invoice.hostedInvoiceUrl ? (
                    <Button
                      variant="outline"
                      asChild
                      rel="noreferrer"
                    >
                      <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                        <Wallet className="size-4" />
                        Ver no Stripe
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
