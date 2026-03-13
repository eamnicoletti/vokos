import type { OrganizationPlanCode } from "@/lib/auth";

export type AppPlan = {
  code: OrganizationPlanCode;
  label: string;
  originalPrice: string;
  priceLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
  landingHref: string;
  landingCtaLabel: string;
  landingButtonVariant?: "default" | "outline";
};

export const APP_PLANS: AppPlan[] = [
  {
    code: "essencial",
    label: "Essencial",
    originalPrice: "R$ 99,00",
    priceLabel: "R$ 59 / mes",
    description: "Para advogados solos ou pequenos escritorios",
    features: [
      "1 usuario",
      "1 Workspace",
      "Ate 40 processos",
      "Leitura de emails juridicos",
      "Criacao automatica de tarefas",
      "Dashboard de prazos"
    ],
    landingHref: "/signup",
    landingCtaLabel: "Testar agora",
    landingButtonVariant: "outline"
  },
  {
    code: "equipe",
    label: "Equipe",
    originalPrice: "R$ 249,00",
    priceLabel: "R$ 149 / mes",
    description: "Ideal para escritorios com colaboradores",
    features: [
      "Tudo do plano Essencial",
      "Ate 5 usuarios",
      "Ate 5 Workspaces",
      "Ate 300 processos",
      "Monitoramento de tribunais",
      "IA que interpreta andamentos",
      "Calculo automatico de prazo"
    ],
    popular: true,
    landingHref: "/signup",
    landingCtaLabel: "Testar agora",
    landingButtonVariant: "default"
  },
  {
    code: "enterprise",
    label: "Enterprise",
    originalPrice: "R$ 649,00",
    priceLabel: "R$ 449 / mes",
    description: "Para escritorios com mais de 300 processos",
    features: [
      "Tudo do plano Equipe",
      "Usuarios ilimitados",
      "Workspaces ilimitados",
      "Processos ilimitados",
      "Automacoes avancadas",
      "Assistente juridico por chat",
      "Relatorios de produtividade"
    ],
    landingHref: "/login",
    landingCtaLabel: "Em breve",
    landingButtonVariant: "outline"
  }
];
