import Image from "next/image";

export default function ContentSection() {
  return (
    <section id="solucao" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Do caos do inbox para um fluxo jurídico previsível.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <div className="bg-linear-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                src="/images/front-view-blurry-lawyer-working.webp"
                className="hidden rounded-[15px] object-cover dark:block"
                alt="Equipe jurídica organizando demandas"
                width={1207}
                height={929}
              />
              <Image
                src="/images/hero_dashboard.avif"
                className="rounded-[15px] shadow dark:hidden"
                alt="Painel da Vokos com tarefas jurídicas"
                width={1207}
                height={929}
              />
            </div>
          </div>

          <div className="relative space-y-4">
            <p className="text-muted-foreground">
              A Vokos captura sinais relevantes dos seus fluxos e transforma tudo em tarefas claras, com responsável,
              prazo e contexto.
            </p>
            <p className="text-muted-foreground">
              Com o time inteiro no mesmo quadro, seu escritório ganha previsibilidade operacional sem depender de
              controles manuais espalhados.
            </p>

            <div className="pt-6">
              <blockquote className="border-l-4 pl-4">
                <p>
                  Em menos de duas semanas, nosso contencioso reduziu retrabalho e passou a acompanhar prazos críticos
                  com muito mais segurança.
                </p>

                <div className="mt-6 space-y-3">
                  <cite className="block font-medium">Fernanda R., sócia de escritório</cite>
                  <p className="text-muted-foreground text-sm">Equipe com 18 colaboradores</p>
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
