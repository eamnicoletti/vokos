import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
  return (
    <section id="planos" className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-center text-4xl font-semibold lg:text-5xl">Planos para o tamanho do seu escritório</h2>
          <p>
            Comece com rapidez e evolua sua operação jurídica com governança, colaboração e automação de tarefas.
          </p>         
          <Badge variant="secondary" className="font-semibold text-sm px-4 py-1 rounded-full">
            Teste grátis por 30 dias
          </Badge>
        </div>
        <div className="mt-8 grid gap-6 [--color-card:var(--color-muted)] *:border-none *:shadow-none md:mt-12 md:grid-cols-3 dark:[--color-muted:var(--color-zinc-900)]">
          <Card className="bg-muted flex flex-col">
            <CardHeader>
              <CardTitle className="font-medium">Essencial</CardTitle>
              <span className="my-3 block text-2xl font-semibold">R$ 59 / mês</span>
              <CardDescription className="text-sm">Para advogados solos ou pequenos escritórios</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {[
                  "1 usuário",
                  "1 Workspace",
                  "Até 40 processos",
                  "Leitura de emails jurídicos",
                  "Criação automática de tarefas",
                  "Dashboard de prazos"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Testar agora</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted relative">
            <Badge className="bg-blue-500 absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full">
              Popular
            </Badge>

            <div className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-medium">Equipe</CardTitle>
                <span className="my-3 block text-2xl font-semibold">R$ 149 / mês</span>
                <CardDescription className="text-sm">Ideal para escritórios com colaboradores</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />
                <ul className="list-outside space-y-3 text-sm">
                  {[
                    "Tudo do plano Essencial",
                    "Até 5 usuários",
                    "Até 5 Workspaces",
                    "Até 300 processos",
                    "Monitoramento de tribunais",
                    "IA que interpreta andamentos",
                    "Cálculo automático de prazo",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/signup">Testar agora</Link>
                </Button>
              </CardFooter>
            </div>
          </Card>

          <Card className="bg-muted flex flex-col">
            <CardHeader>
              <CardTitle className="font-medium">Enterprise</CardTitle>
              <span className="my-3 block text-2xl font-semibold">R$ 449 / mês</span>
              <CardDescription className="text-sm">Para escritórios com mais de 300 processos</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {[
                  "Tudo do plano Equipe",
                  "Usuários ilimitados",
                  "Workspaces ilimitados",
                  "Processos ilimitados",
                  "Automações avançadas",
                  "Assistente jurídico por chat",
                  "Relatórios de produtividade"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Em breve</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
