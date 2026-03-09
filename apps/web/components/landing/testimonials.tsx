import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Testimonials() {
    return (
        <section id="depoimentos" className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-4xl font-medium lg:text-5xl">Resultados reais em escritórios brasileiros</h2>
                    <p>Depoimentos de clientes fictícios, criados para ilustrar como a Vokos apoia operações jurídicas com equipe.</p>
                </div>

                <div className="*:bg-muted grid gap-4 *:border-none *:shadow-none sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
                    <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
                        <CardHeader>
                            <p className="text-sm font-medium tracking-wide text-muted-foreground">CASO DE USO - CONTENCIOSO CÍVEL</p>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-xl font-medium">Antes da Vokos, nosso time gastava horas triando e-mail e repassando tarefa manualmente. Hoje o fluxo entra organizado, com responsável e prazo, e o risco de perda caiu drasticamente.</p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12 border">
                                        <AvatarImage
                                            src="https://tailus.io/images/reviews/shekinah.webp"
                                            alt="Patricia Menezes"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>PM</AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <cite className="text-sm font-medium">Patricia Menezes</cite>
                                        <span className="text-muted-foreground block text-sm">Sócia, escritório com 14 colaboradores</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p className="text-xl font-medium">A distribuição de demandas ficou transparente para toda a equipe. Cada tarefa tem dono e histórico claro.</p>

                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <Avatar className="size-12 border">
                                        <AvatarImage
                                            src="https://tailus.io/images/reviews/jonathan.webp"
                                            alt="Ricardo Fontes"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>RF</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium">Ricardo Fontes</cite>
                                        <span className="text-muted-foreground block text-sm">Coordenador jurídico</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p>Com a auditoria da Vokos, consigo justificar mudanças de prioridade sem ruído na operação.</p>

                                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                                    <Avatar className="size-12 border">
                                        <AvatarImage
                                            src="https://tailus.io/images/reviews/yucel.webp"
                                            alt="Helena Duarte"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>HD</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <cite className="text-sm font-medium">Helena Duarte</cite>
                                        <span className="text-muted-foreground block text-sm">Gestora de operações jurídicas</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="card variant-mixed">
                        <CardContent className="h-full pt-6">
                            <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                                <p>Nosso onboarding foi rápido e o time adotou porque o fluxo é simples: ver, agir e concluir.</p>

                                <div className="grid grid-cols-[auto_1fr] gap-3">
                                    <Avatar className="size-12 border">
                                        <AvatarImage
                                            src="https://tailus.io/images/reviews/rodrigo.webp"
                                            alt="Leandro Queiroz"
                                            height="400"
                                            width="400"
                                            loading="lazy"
                                        />
                                        <AvatarFallback>LQ</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">Leandro Queiroz</p>
                                        <span className="text-muted-foreground block text-sm">Sócio-administrador</span>
                                    </div>
                                </div>
                            </blockquote>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
