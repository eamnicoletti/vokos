'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function FAQs() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'Em quanto tempo a Vokos começa a gerar valor?',
            answer: 'Escritórios costumam configurar o workspace inicial em poucas horas. A partir disso, a equipe já consegue centralizar tarefas e reduzir a triagem manual de e-mails no dia a dia.',
        },
        {
            id: 'item-2',
            question: 'A Vokos funciona para escritório com vários colaboradores?',
            answer: 'Sim. O produto foi pensado para operação em equipe, com papéis de acesso, distribuição de responsabilidades e histórico auditável de alterações.',
        },
        {
            id: 'item-3',
            question: 'Como funciona a automação de e-mails para tarefas?',
            answer: 'A Vokos processa os sinais relevantes do fluxo de e-mail e cria tarefas com contexto para o time. Itens com menor confiança podem ser roteados para revisão antes da execução.',
        },
        {
            id: 'item-4',
            question: 'Consigo acompanhar quem alterou cada tarefa?',
            answer: 'Sim. A plataforma registra eventos críticos para dar rastreabilidade de alterações, reforçando governança e segurança operacional do escritório.',
        },
        {
            id: 'item-5',
            question: 'A Vokos substitui meu software jurídico atual?',
            answer: 'A proposta da Vokos é organizar a execução e reduzir retrabalho operacional. Ela pode complementar ferramentas existentes, centralizando tarefas e prazos em um único fluxo de trabalho.',
        },
    ]

    return (
        <section id="faq" className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-8 md:grid-cols-5 md:gap-12">
                    <div className="md:col-span-2">
                        <h2 className="text-foreground text-4xl font-semibold">Perguntas frequentes</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">Tudo o que você precisa para decidir com segurança</p>
                        <p className="text-muted-foreground mt-6 hidden md:block">
                            Ainda com dúvidas?{' '}
                            <a href="/signup" className="text-primary font-medium hover:underline">
                                Fale com nosso time
                            </a>
                        </p>
                    </div>

                    <div className="md:col-span-3">
                        <Accordion
                            type="single"
                            collapsible>
                            {faqItems.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={item.id}>
                                    <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-base">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    <p className="text-muted-foreground mt-6 md:hidden">
                        Ainda com dúvidas?{' '}
                        <a href="/signup" className="text-primary font-medium hover:underline">
                            Fale com nosso time
                        </a>
                    </p>
                </div>
            </div>
        </section>
    )
}
