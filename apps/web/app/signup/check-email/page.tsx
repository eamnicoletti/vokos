import type { Route } from "next";
import Link from "next/link";
import { MailCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/workspace";
  }

  return value;
}

export default async function SignupCheckEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; next?: string; organization?: string }>;
}) {
  const { email, next, organization } = await searchParams;
  const nextPath = safeNextPath(next);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}${email ? `&email=${encodeURIComponent(email)}` : ""}${
    organization ? `&organization=${encodeURIComponent(organization)}` : ""
  }`;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-6 py-10">
      <Card className="relative w-full max-w-2xl overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <CardHeader className="relative space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Confirme seu e-mail para entrar</CardTitle>
            <CardDescription className="text-base leading-7">
              {organization ? (
                <>
                  Enviamos um link de confirmação para <strong>{email ?? "seu e-mail"}</strong>. Assim que você confirmar,
                  vamos concluir seu acesso à organização <strong>{organization}</strong>.
                </>
              ) : (
                <>
                  Enviamos um link de confirmação para <strong>{email ?? "seu e-mail"}</strong>. Depois da confirmação,
                  seu acesso será liberado automaticamente.
                </>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="size-4 text-primary" />
              O que acontece depois
            </div>
            <p>
              Ao clicar no link do e-mail, você será direcionado para a plataforma e o convite será aceito para entrar no
              workspace da organização.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={loginHref as Route}>Já confirmei, entrar agora</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={"/" as Route}>Voltar para a home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
