import type { Route } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InviteAcceptStateProps = {
  title: string;
  description: string;
  tone?: "default" | "success" | "warning";
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function InviteAcceptState({
  title,
  description,
  tone = "default",
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel
}: InviteAcceptStateProps) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertCircle : Mail;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted px-6 py-10">
      <Card className="relative w-full max-w-xl overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <CardHeader className="relative space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <Icon className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base leading-7">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="size-4 text-primary" />
              Próximo passo
            </div>
            <p>Continue pelo fluxo abaixo para concluir o acesso à organização e entrar no workspace correto.</p>
          </div>
          <div className="flex flex-wrap gap-3">
          {primaryHref && primaryLabel ? (
            <Button asChild>
              <Link href={primaryHref as Route}>{primaryLabel}</Link>
            </Button>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="outline">
              <Link href={secondaryHref as Route}>{secondaryLabel}</Link>
            </Button>
          ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
