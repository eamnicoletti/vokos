# Vokos - MVP Architecture Baseline v1

Status: **Locked for MVP**  
Version: **v1.0**  
Date: **2026-03-05**

## 1. Purpose

This document locks implementation decisions for the Vokos MVP.

Rule:
- During MVP execution, do not keep parallel architectural alternatives open.
- Any significant change must update this baseline and related docs.

## 2. Product Context (MVP)

Target market:
- Brazilian lawyers and law firms

MVP promise:
- Multi-tenant legal Kanban with AI-assisted task creation and auditability
- Lower operational labor cost by reducing manual email triage and task transcription

## 3. Decision Log (Locked)

## D-001 - Monorepo boundaries
Decision:
- Keep monorepo structure with `apps/web`, `services/ai_server`, and `packages/shared`.

Acceptance:
- No Python runtime logic in `apps/web`.
- No frontend logic in `services/ai_server`.

## D-002 - Web stack
Decision:
- Next.js App Router + TypeScript + TailwindCSS + shadcn/ui + Outfit font.

Acceptance:
- No additional UI framework.
- Mutations use Server Actions except explicit webhook/callback routes.

## D-003 - Data and auth platform
Decision:
- Supabase Auth + Postgres + RLS is mandatory for MVP.

Acceptance:
- All tenant tables have `workspace_id`.
- RLS enabled across tenant tables.

## D-004 - MVP roles
Decision:
- Roles are `admin`, `manager`, `member`.
- `viewer` is post-MVP.

Acceptance:
- Backend enforces role checks for mutable operations.

## D-005 - Required MVP entities
Decision:
- Required entities: workspaces, workspace_members, projects, boards, lists, tasks, task_comments, audit_events, ingestion_items, integrations, billing_customers, billing_subscriptions, billing_events.

Acceptance:
- End-to-end MVP flow works without V2-only entities.

## D-006 - Task provenance
Decision:
- Every task stores creator type, source metadata, and edit metadata.

Acceptance:
- Bot-created tasks without source metadata are invalid.

## D-007 - Audit model
Decision:
- `audit_events` is append-only and mandatory for critical actions.

Acceptance:
- UPDATE/DELETE on `audit_events` is blocked.
- Task detail exposes audit history.

## D-008 - Ingestion scope
Decision:
- MVP ingestion source is email-first.
- DJE and portals are post-MVP.

Acceptance:
- Email ingestion runs from capture to task creation/review routing.

## D-009 - AI provider
Decision:
- Google Gemini is the official MVP AI provider.

Acceptance:
- AI client isolated in dedicated module.
- Outputs are strict schema-validated JSON.

## D-010 - Extraction flow
Decision:
- Fixed stages: ingest -> preprocess -> classify -> extract -> create task.

Acceptance:
- Low confidence routes to review list.
- Dedup by (`workspace_id`, `hash`).

## D-011 - Service contract
Decision:
- AI server does not write directly to database.
- Web backend is the single persistence authority.

Acceptance:
- Internal endpoint-based integration with service auth.

## D-012 - Async processing
Decision:
- MVP uses simple worker + scheduled execution pattern.
- No day-1 Redis/BullMQ.

Acceptance:
- Retry with backoff and terminal failure states.

## D-013 - Billing model
Decision:
- Stripe is billing source of truth.
- Local billing tables mirror status via webhooks.

Acceptance:
- Signature verification + idempotent event handling.

## D-014 - Plan enforcement
Decision:
- Enforce active seat limit and monthly processed events limit.

Acceptance:
- Limit violations return clear backend errors.

## D-015 - Secrets and logging
Decision:
- Secrets stay in managed secret stores only.
- Sensitive data is redacted in logs.

Acceptance:
- No secrets in frontend or repository.
- No full raw legal payload logs.

## D-016 - LGPD minimum posture
Decision:
- Minimize retained sensitive data.
- Store raw payload by reference.

Acceptance:
- Retention policy documented by data type.

## D-017 - MVP observability
Decision:
- Structured logs + correlation IDs + four mandatory metrics.

Mandatory metrics:
- ingestion_success_rate
- extraction_success_rate
- bot_task_creation_latency
- failed_jobs_count

Acceptance:
- Pipeline traceability end-to-end.

## D-018 - Environments
Decision:
- Official environments: `local`, `preview`, `production`.

Acceptance:
- Variable matrix documented per environment.

## D-019 - Deployment
Decision:
- Web on Vercel, AI server on managed container platform, Supabase managed.

Acceptance:
- Automated deploy and rollback process documented.

## D-020 - CI/CD baseline
Decision:
- CI must run lint, typecheck, core tests, and schema validation.

Acceptance:
- Main branch merge blocked on CI failure.

## 4. Required Data Contracts

AI extraction request minimum fields:
- `workspace_id`
- `ingestion_item_id`
- `sanitized_text`
- `source_type`
- `received_at`
- `correlation_id`

AI extraction response minimum fields:
- `classification`
- `recommended_action`
- `process_number` (optional)
- `deadline_date` or `deadline_days` (optional)
- `confidence`
- `evidence_snippets`
- `provider` (`gemini`)
- `model`
- `prompt_version`

Invalid output handling:
- retry, then fallback to human review.

## 5. Explicitly Out of MVP

- DJE full automation
- Tribunal portal automation
- OpenClaw orchestration
- Advanced legal prediction workflows

## 6. MVP Production Readiness Criteria

- Workspace creation and membership works
- Kanban board CRUD and movement works
- Audit is visible in task detail
- Email ingestion can create tasks automatically
- Low-confidence items route to review
- Stripe billing sync works via webhooks
- Multi-tenant isolation is tested
- Critical errors are observable and actionable

## 7. Change Governance

Any major architecture change must:
- update this baseline
- update `docs/ARCHITECTURE.md`
- update `docs/SECURITY.md`
- update `docs/DATABASE_SCHEMA.md`
