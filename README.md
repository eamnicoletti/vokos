# Vokos (vokos.ai)

Vokos is a multi-tenant legal productivity SaaS for Brazilian law firms.

It combines:
- Kanban task management for legal teams
- AI automation that converts legal signals into actionable tasks

Core business outcome:
- Reduce operational labor cost by automating repetitive email-to-task conversion work.

## Monorepo

- `apps/web`: Next.js App Router application
- `services/ai_server`: FastAPI AI extraction service
- `packages/shared`: shared schemas/contracts
- `docs`: product, architecture, security, and database documentation

## MVP Baseline (Locked)

The implementation baseline is locked in:
- `docs/MVP_ARCHITECTURE_BASELINE_V1.md`
- `docs/IMPLEMENTATION_CHECKLIST_MILESTONES.md` (execution checklist M1/M2/M3)

Core MVP decisions:
- Supabase Auth + Postgres + RLS
- Stripe billing via webhook synchronization
- Google Gemini as AI provider
- Email ingestion first (DJE and portals are post-MVP)
- Customer mailbox integrations are read-only (no send/reply/draft as customer identity)
- Mandatory audit trail for critical actions

## UI Standards (Non-negotiable)

- TailwindCSS
- shadcn/ui
- Google Font: Outfit

## Security Standards (Non-negotiable)

- Strict workspace isolation (`workspace_id`) on all reads/writes
- RLS enabled for all multi-tenant tables
- No secrets in frontend code or client-side env vars
- Structured audit trail for tasks and critical entities
