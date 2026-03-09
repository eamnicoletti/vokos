import { Card } from '@/components/ui/card'
import { Table } from './table'

export default function Features() {
    return (
        <section id="funcionalidades">
            <div className="bg-muted/50 py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div>
                        <h2 className="text-foreground text-4xl font-semibold">Menos risco de prazo perdido. Mais controle do escritório.</h2>
                        <p className="text-muted-foreground mb-12 mt-4 text-balance text-lg">A Vokos transforma atualizações jurídicas em tarefas acionáveis, distribui responsáveis e organiza o trabalho do time em um único fluxo auditável.</p>
                        <div className="bg-foreground/5 rounded-3xl p-6">
                            <Table />
                        </div>
                    </div>

                    <div className="border-foreground/10 relative mt-16 grid gap-12 border-b pb-12 [--radius:1rem] md:grid-cols-2">
                        <div>
                            <h3 className="text-foreground text-xl font-semibold">Triagem automatizada de e-mails jurídicos</h3>
                            <p className="text-muted-foreground my-4 text-lg">Reduza trabalho operacional repetitivo convertendo comunicações relevantes em tarefas com contexto e prioridade.</p>
                            <Card className="aspect-video overflow-hidden bg-muted px-6">
                                <Card className="h-full translate-y-6" />
                            </Card>
                        </div>
                        <div>
                            <h3 className="text-foreground text-xl font-semibold">Execução colaborativa com rastreabilidade</h3>
                            <p className="text-muted-foreground my-4 text-lg">Visualize quem fez o que, quando e por qual motivo, com histórico claro para sócios, gestores e equipe.</p>
                            <Card className="aspect-video overflow-hidden bg-muted">
                                <Card className="translate-6 h-full" />
                            </Card>
                        </div>
                    </div>

                    <blockquote className="before:bg-primary relative mt-12 max-w-xl pl-6 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full">
                        <p className="text-foreground text-lg">"A gente parou de depender de planilha e memória. Hoje cada atualização vira ação concreta para o time certo."</p>
                        <footer className="mt-4 flex items-center gap-2">
                            <cite>Mariana S., gestora de operações jurídicas</cite>
                            <span
                                aria-hidden
                                className="bg-foreground/15 size-1 rounded-full"></span>
                            <span className="text-muted-foreground">Escritório com 12 colaboradores</span>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </section>
    )
}
