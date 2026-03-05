# Vokos - Architecture

## 1. Scope and Status

This document defines the implementation architecture for Vokos MVP.

Source of truth:
- `docs/MVP_ARCHITECTURE_BASELINE_V1.md`

If this document conflicts with the baseline, the baseline wins.

## 2. Architecture Goals

- Reliability for legal task execution
- Strict multi-tenant isolation
- Clear service boundaries
- Full auditability of critical operations
- Fast iteration without infrastructure overengineering

## 3. System Overview

Main components:
- `apps/web` (Next.js App Router): product UI, server actions, internal APIs, webhook handlers
- `services/ai_server` (FastAPI): preprocessing, classification, structured extraction using Gemini
- Supabase (Postgres + Auth + RLS): identity and transactional data
- Stripe: billing source of truth

Core flow:
1. User authenticates and acts inside one workspace
2. Web app reads/writes workspace-scoped entities
3. Ingestion item is created from email source
4. AI server processes sanitized content
5. Web backend validates output and creates task
6. Audit events are appended for critical actions

## 4. Monorepo Boundaries

- `apps/web` must not include Python runtime logic
- `services/ai_server` must not include frontend logic
- `packages/shared` stores versioned contracts and shared schemas
- No direct circular imports across app/service boundaries

## 5. Locked Technology Decisions

Web:
- Next.js App Router + TypeScript
- TailwindCSS + shadcn/ui
- Outfit as global font

Data/Auth:
- Supabase Auth + Postgres + RLS

AI:
- FastAPI service
- Google Gemini as provider
- JSON schema validated outputs only

Billing:
- Stripe webhooks synchronized to local billing tables

## 6. Tenant Model and Access

Tenant unit:
- `workspace`

Hard rules:
- Every tenant table includes `workspace_id`
- Every query is workspace-scoped
- RLS is enabled on all multi-tenant tables
- Backend role authorization is required for mutable actions

MVP roles:
- `admin`
- `manager`
- `member`

## 7. Domain Model (MVP)

Required entities:
- workspaces
- workspace_members
- projects
- boards
- lists
- tasks
- task_comments
- audit_events
- ingestion_items
- integrations
- billing_customers
- billing_subscriptions
- billing_events

Task provenance fields (mandatory):
- `created_by_type` (`human|bot|system`)
- `source_type` (`manual|email|dje|portal`)
- `edited_count`
- `last_edited_at`
- `last_edited_by_user_id`

## 8. API and Service Contracts

Principle:
- AI server never writes directly to the database.

Contract:
1. Web backend sends sanitized extraction request to AI server
2. AI server returns validated structured payload
3. Web backend applies business rules and persists entities
4. Web backend writes audit events

Required correlation fields in inter-service calls:
- `workspace_id`
- `ingestion_item_id`
- `correlation_id`

## 9. Ingestion and AI Pipeline (MVP)

MVP source:
- Email only

Pipeline stages:
1. Ingestion capture and dedup hash creation
2. Deterministic preprocessing (regex/date/process patterns)
3. Classification
4. Structured extraction (Gemini)
5. Task creation or review routing

Routing rules:
- low confidence -> "Revisao" list
- valid confidence -> target workflow list
- duplicate hash in same workspace -> no duplicate task

## 10. Background Processing

MVP processing model:
- single worker pattern with scheduled jobs
- retry with exponential backoff
- terminal failure status persisted for manual handling

No day-1 dependency on Redis/BullMQ.

## 11. Billing Architecture

Billing model:
- Stripe is financial source of truth
- local billing tables mirror status for app enforcement

Required webhook behavior:
- signature verification
- event idempotency using `stripe_event_id`
- auditable updates to subscription state

Plan enforcement in backend:
- active users limit
- monthly processed events limit

## 12. Observability and Operations

Logging:
- structured JSON logs
- redacted sensitive fields
- correlation by request/job ids

Required MVP metrics:
- ingestion_success_rate
- extraction_success_rate
- bot_task_creation_latency
- failed_jobs_count

Alerting minimum:
- ingestion failures spike
- extraction failures spike
- webhook processing failures

## 13. Deployment Model (MVP)

- Web app: Vercel
- AI server: managed container platform (Railway/Fly/Render)
- Database/Auth/Storage: Supabase managed

Environments:
- local
- preview
- production

Each environment must have a documented variable matrix.

## 14. CI/CD Baseline

Required CI checks:
- lint
- typecheck
- essential unit tests
- migration/schema validation

Merge to main must be blocked on CI failure.

## 15. Post-MVP Direction

Explicitly post-MVP architecture items:
- DJE ingestion automation
- tribunal portal integrations
- agentic orchestration (OpenClaw)
- advanced legal timeline intelligence

