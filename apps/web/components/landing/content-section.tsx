import AnimatedBeamComponent from "./animated-beam";

export default function ContentSection() {
  return (
    <section id="solucao" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-12">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Do caos do inbox para um fluxo jurídico previsível.
        </h2>
        <div className="space-y-8 md:space-y-10">
          <div className="relative flex justify-center">
            <AnimatedBeamComponent />
          </div>

          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                A Vokos captura sinais relevantes dos seus fluxos e transforma tudo em tarefas claras, com
                prazo e contexto.
              </p>
              <p className="text-muted-foreground">
                Com o time inteiro no mesmo quadro, seu escritório ganha previsibilidade operacional sem depender de
                controles manuais espalhados.
              </p>
            </div>

            <div className="md:pl-2">
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
