# Vokos - Cursor Rules (Global)

## Identity
- Project: Vokos
- Domain: vokos.ai
- Market: Brazilian legal teams (lawyers and law firms)
- Monorepo: Next.js web app + Python AI server

## Locked MVP Architecture
- Follow `docs/MVP_ARCHITECTURE_BASELINE_V1.md` as implementation source of truth.
- Do not introduce alternative architecture paths during MVP without updating baseline docs.

## Non-negotiable UI Rules
- Use TailwindCSS for styling.
- Prefer shadcn/ui components for UI primitives.
- Do not add other UI frameworks.
- Use Outfit as global font.

## Monorepo Boundaries
- Keep web code in `apps/web`.
- Keep AI server code in `services/ai_server`.
- Keep shared contracts in `packages/shared`.
- Do not mix Python runtime logic into the web app.
- Do not mix frontend logic into the AI server.

## Security and Multi-Tenant Rules
- Everything is tenant-scoped by `workspace_id`.
- Never allow cross-workspace reads or writes.
- Keep secrets server-side only.
- Never expose integration tokens to frontend clients.
- Ensure auditable actions for critical entities.
- Customer mailbox integrations are read-only only.
- Never implement send/reply/draft actions using customer mailbox credentials.
- Future outbound emails must use Vokos-owned channels, never customer identity.

## Product Scope Rules (MVP)
- Core product is legal Kanban plus AI automation.
- MVP AI source is email-first.
- AI provider for MVP is Google Gemini.
- OpenClaw and multi-source orchestration are post-MVP only.

## Audit Requirements
- Critical mutations must append audit events.
- Tasks must preserve origin/provenance metadata and edit metadata.

## Documentation Rules
- Update architecture/security/schema docs when behavior changes.
- Keep naming and terminology consistent across docs and code.

## What Not To Do
- Do not bypass RLS expectations with unsafe data access patterns.
- Do not add secret values to repository files.
- Do not build scraping-first solutions for MVP ingestion.
