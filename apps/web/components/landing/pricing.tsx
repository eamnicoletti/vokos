import type { Route } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_PLANS } from "@/lib/plans";

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
          {APP_PLANS.map((plan) => {
            const cardClassName =
              plan.code === "enterprise" ? "bg-muted flex flex-col bg-blue-500/10" : "bg-muted flex flex-col";

            return (
              <Card key={plan.code} className={plan.popular ? "bg-muted relative" : cardClassName}>
                {plan.popular ? (
                  <Badge className="bg-blue-500 absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full shadow-lg shadow-blue-500/20">
                    Popular
                  </Badge>
                ) : null}

                <div className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-medium">{plan.label}</CardTitle>
                    <div className="flex flex-col pt-3">
                      <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                      <span className="text-2xl font-semibold">{plan.priceLabel}</span>
                    </div>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className={plan.popular ? "space-y-4 mb-2" : "space-y-4"}>
                    <hr className="border-dashed" />

                    <ul className="list-outside space-y-3 text-sm">
                      {plan.features.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <Check className="size-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className={plan.popular ? undefined : "mt-auto"}>
                    <Button
                      asChild
                      variant={plan.landingButtonVariant}
                      className={plan.code === "enterprise" ? "w-full bg-blue-200 text-white dark:bg-blue-950" : "w-full"}
                    >
                      <Link href={plan.landingHref as Route}>{plan.landingCtaLabel}</Link>
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
