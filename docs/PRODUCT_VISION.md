# Vokos - Product Vision

## 1. Product Summary

Vokos is a legal operations SaaS for Brazilian law firms.

The product combines:
- AI-powered extraction from legal communications
- Automatic task creation
- Kanban execution workflows
- Multi-tenant organization management

Primary goal:
- reduce missed legal deadlines and manual operational workload.

## 2. Product Model (Source of Truth)

### 2.1 Account and activation
- User account creation is free.
- Account creation alone does not grant product usage.
- Product access requires one of:
  - creating a paid organization, or
  - accepting an invitation to an existing organization.

### 2.2 Post-login routing
- Users with organization membership see an organization selector.
- Users without memberships enter the `Create Organization` flow.

### 2.3 Billing and ownership
- Each organization maps to exactly one Stripe subscription.
- A user may own multiple organizations.
- Plan limits apply per organization, not per user.

Example:
- User Joao
- Organization A -> Subscription A
- Organization B -> Subscription B

## 3. System Hierarchy

```text
User
  -> Organization
    -> Workspaces
      -> Boards
        -> Lists
          -> Tasks
```

Definitions:
- `User`: personal identity that can participate in multiple organizations.
- `Organization`: a law firm billing and membership boundary.
- `Workspace`: a functional area in an organization (Juridico, Administrativo, Marketing).
- `Board`: Kanban board in a workspace (MVP supports Kanban only).
- `List`: workflow column in a board.
- `Task`: actionable work item in a list.

## 4. Core Problems

Legal teams lose reliability because important signals are fragmented across:
- emails
- court updates and procedural movements
- internal communication channels

Operational impact:
- late responses and missed deadlines
- heavy manual triage work
- low traceability of ownership and changes

## 5. Value Proposition

Vokos centralizes legal execution and converts legal communication into auditable tasks.

Main value pillars:
- Reliability: reduced deadline risk
- Productivity: less manual triage
- Traceability: clear history of task actions
- Scalability: organization-level subscriptions and limits

## 6. Ideal Customer Profile

Primary ICP:
- solo lawyers
- small and medium law firms
- teams that still depend on manual email and publication triage

Secondary ICP:
- larger firms that need high-volume process monitoring and productivity reporting

## 7. Official Pricing Model

### 7.1 Essencial
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

### 7.2 Equipe
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

### 7.3 Enterprise
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

## 8. MVP Scope and Permissions

MVP includes:
- organization onboarding with paid plan selection
- organization membership and invitation flow
- workspace/board/list/task hierarchy
- Kanban execution workflow
- AI extraction pipeline for legal communications (Google Gemini)
- Supabase Auth + Postgres + RLS
- Stripe subscription synchronization

MVP permissions:
- Only owners can create workspaces, invite members, and remove members.
- Members can view boards, move tasks, and edit tasks.
- Members cannot create workspaces, invite users, or delete organization.

## 9. Invitation Flow

- Owner invites member by email.
- Existing account email -> direct membership assignment.
- New email -> sign-up then automatic organization join.

## 10. V2 Permission Roadmap (Documented, Not Implemented)

V2 introduces granular permissions managed by organization owner:
- create workspaces
- invite users
- remove users
- delete tasks
- manage boards

This requires a more advanced RBAC system than MVP owner/member controls.

## 11. Success Metrics

Business metrics:
- active paid organizations
- organization activation rate after signup
- conversion from free account to paid organization
- retention by plan (Essencial, Equipe, Enterprise)

Operational metrics:
- ingestion-to-task creation time
- extraction success rate
- percentage of tasks created automatically with no rework
- monitored process usage against plan limits

## 12. Positioning

Vokos is not a generic task manager.

Positioning statement:
- "A legal operations platform that transforms legal communication into actionable and auditable tasks for law firms."
