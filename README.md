# Vokos (vokos.ai)

Vokos is a multi-tenant SaaS platform for Brazilian law firms.

It combines:
- AI-powered task creation from legal communications
- Kanban task management
- Workspace-based execution inside paid organizations

## Product Model (Current)

### Account and access
- A `user account` is free.
- A user can only use the product after either:
  - creating a paid `organization`, or
  - being invited to an existing organization.

### Login routing
- If the user belongs to one or more organizations: show organization selector.
- If the user belongs to no organizations: show `Create Organization` flow.

### Subscription model
- Each organization has exactly one Stripe subscription.
- A user can own multiple organizations, each with an independent subscription.
- Plan limits are enforced per organization.

Example:
- User Joao
- Organization A -> Subscription A
- Organization B -> Subscription B

## System Hierarchy

```text
User
  -> Organization
    -> Workspaces
      -> Boards
        -> Lists
          -> Tasks
```

Definitions:
- `User`: personal account, can belong to multiple organizations.
- `Organization`: law firm account, billing owner, and member container.
- `Workspace`: functional area inside an organization (ex: Juridico, Administrativo, Marketing).
- `Board`: Kanban board inside a workspace (MVP supports Kanban only).
- `List`: board column.
- `Task`: card inside a list.

## MVP Permissions

Only organization owners can:
- create workspaces
- invite members
- remove members

Members can:
- view boards
- move tasks
- edit tasks

Members cannot:
- create workspaces
- invite members
- delete the organization

## Invitation Flow

- Invitations are sent by email.
- If the invited email already has an account: user is added to organization.
- If the invited email has no account: user signs up and is auto-joined to organization.

## Official Pricing

### Essencial
- Price: `R$ 59 / mes`
- Target: advogados solos ou pequenos escritorios
- Limits:
  - `1 usuario`
  - `1 workspace`
  - `ate 40 processos monitorados`
- Features:
  - leitura de emails juridicos
  - criacao automatica de tarefas
  - dashboard de prazos

### Equipe
- Price: `R$ 149 / mes`
- Target: escritorios com colaboradores
- Limits:
  - `ate 5 usuarios`
  - `ate 5 workspaces`
  - `ate 300 processos monitorados`
- Features:
  - tudo do plano Essencial
  - monitoramento de tribunais
  - IA que interpreta andamentos
  - calculo automatico de prazo

### Enterprise
- Price: `R$ 449 / mes`
- Target: escritorios com mais de 300 processos
- Limits:
  - `usuarios ilimitados`
  - `workspaces ilimitados`
  - `processos ilimitados`
- Features:
  - tudo do plano Equipe
  - automacoes avancadas
  - assistente juridico por chat
  - relatorios de produtividade

## Technology Stack

Frontend:
- Next.js
- TailwindCSS
- shadcn/ui
- Google Font: Outfit

Backend:
- Supabase (Auth + Postgres + RLS)

Payments:
- Stripe

AI services:
- Python server for document parsing and AI extraction (Google Gemini)

## Monorepo

- `apps/web`: Next.js App Router application
- `services/ai_server`: FastAPI AI extraction service
- `packages/shared`: shared schemas/contracts
- `docs`: product, architecture, security, database documentation

## Local Development

- Install dependencies: `pnpm install`
- Run web app: `pnpm dev:web`
- Run AI server: `pnpm dev:ai`
