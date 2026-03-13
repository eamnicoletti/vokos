import type { OrganizationPlanCode } from "@/lib/auth";

export type AppPlan = {
  code: OrganizationPlanCode;
  label: string;
  originalPrice: string;
  priceLabel: string;
  monthlyPriceInCents: number;
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
    priceLabel: "R$ 59 / mês",
    monthlyPriceInCents: 5900,
    description: "Para advogados solos ou pequenos escritórios",
    features: [
      "1 usuário",
      "1 Workspace",
      "Até 40 processos",
      "Leitura de emails jurídicos",
      "Criação automática de tarefas",
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
    priceLabel: "R$ 149 / mês",
    monthlyPriceInCents: 14900,
    description: "Ideal para escritórios com colaboradores",
    features: [
      "Tudo do plano Essencial",
      "Até 5 usuários",
      "Até 5 Workspaces",
      "Até 300 processos",
      "Monitoramento de tribunais",
      "IA que interpreta andamentos",
      "Cálculo automático de prazo"
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
    priceLabel: "R$ 449 / mês",
    monthlyPriceInCents: 44900,
    description: "Para escritórios com mais de 300 processos",
    features: [
      "Tudo do plano Equipe",
      "Usuários ilimitados",
      "Workspaces ilimitados",
      "Processos ilimitados",
      "Automações avançadas",
      "Assistente jurídico por chat",
      "Relatórios de produtividade"
    ],
    landingHref: "/login",
    landingCtaLabel: "Em breve",
    landingButtonVariant: "outline"
  }
];
