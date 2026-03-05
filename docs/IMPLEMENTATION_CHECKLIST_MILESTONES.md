# Vokos - Implementation Checklist (M1/M2/M3)

Status: **Execution-ready**  
Date: **2026-03-05**  
Aligned with: `docs/MVP_ARCHITECTURE_BASELINE_V1.md`

## 1. How to Use This Checklist

- This is the delivery checklist for MVP implementation.
- Do not start a later milestone until the current milestone gate is approved.
- Any scope change must update baseline and this checklist.

## 2. Milestone Plan

- `M1`: Platform foundation (tenant, auth, core Kanban, audit)
- `M2`: AI automation (email ingestion + Gemini extraction + task creation flow)
- `M3`: Billing, operations hardening, and launch readiness

---

## 3. M1 - Platform Foundation

Goal:
- Deliver a secure multi-tenant legal Kanban foundation with traceability.

Checklist:
- [ ] Create monorepo app structure (`apps/web`, `services/ai_server`, `packages/shared`).
- [ ] Initialize Next.js App Router app with TypeScript, TailwindCSS, shadcn/ui, Outfit.
- [ ] Configure Supabase Auth integration in web app.
- [ ] Implement workspace creation flow.
- [ ] Implement workspace membership flow (`admin`, `manager`, `member`).
- [ ] Implement domain tables: workspaces, workspace_members, projects, boards, lists, tasks, task_comments, audit_events.
- [ ] Enable RLS on tenant tables with workspace membership policy baseline.
- [ ] Enforce `workspace_id` scoping in all reads/writes.
- [ ] Implement role checks in backend mutations.
- [ ] Build Kanban board UI (lists + cards + drag/move).
- [ ] Build task detail panel with editable fields.
- [ ] Add task comments in task detail panel.
- [ ] Implement audit event writes for critical task mutations.
- [ ] Expose task audit history in UI.
- [ ] Add basic error/loading/empty states on board and task flows.

Engineering checks:
- [ ] Add migrations for all M1 tables and indexes.
- [ ] Add seed script for local developer workspace bootstrap.
- [ ] Add unit tests for authorization guards and core mutation paths.
- [ ] Add integration test for cross-workspace access denial.

M1 Gate (Go/No-Go):
- [ ] User can create workspace and invite members.
- [ ] User can create/edit/move tasks in a board.
- [ ] Audit events are visible on task detail.
- [ ] Cross-workspace access is blocked and tested.

---

## 4. M2 - AI Automation (Email -> Task)

Goal:
- Automate email-to-task conversion to reduce manual operational labor.

Checklist:
- [ ] Create AI server skeleton (FastAPI + module structure).
- [ ] Implement service-to-service authentication between web and AI server.
- [ ] Create shared request/response schemas for extraction contract.
- [ ] Implement ingestion tables: ingestion_items and integrations.
- [ ] Implement email ingestion capture endpoint/flow (MVP email-first).
- [ ] Implement dedup key handling (`workspace_id`, `hash`).
- [ ] Implement preprocessing stage (sanitization + regex/date/process patterns).
- [ ] Implement classification stage.
- [ ] Implement Google Gemini client in isolated module.
- [ ] Implement strict schema validation for Gemini outputs.
- [ ] Persist extraction metadata (`provider`, `model`, `prompt_version`).
- [ ] Implement confidence routing to regular workflow vs `Revisao` list.
- [ ] Create backend command endpoint for AI extraction persistence.
- [ ] Ensure AI server never writes directly to DB.
- [ ] Add audit events for bot-created tasks and related updates.

Reliability and safety checks:
- [ ] Implement retry with backoff for transient extraction failures.
- [ ] Mark terminal failures for manual review/ops action.
- [ ] Add log redaction for sensitive fields.
- [ ] Ensure no raw full email payload in application logs.

Testing checks:
- [ ] Unit tests for parser, classifier, schema validation.
- [ ] Failure-mode tests for malformed model output.
- [ ] Integration test: email ingestion creates one task only (idempotency).
- [ ] Integration test: low confidence routes to `Revisao`.

M2 Gate (Go/No-Go):
- [ ] Email ingestion pipeline runs end-to-end.
- [ ] Dedup prevents duplicate tasks for same ingestion hash.
- [ ] Bot-created task includes provenance and evidence metadata.
- [ ] Invalid/low-confidence outputs route safely to review.

---

## 5. M3 - Billing, Ops, and Launch Readiness

Goal:
- Make MVP commercially and operationally ready.

Checklist:
- [ ] Implement billing tables: billing_customers, billing_subscriptions, billing_events.
- [ ] Implement Stripe webhook endpoint with signature verification.
- [ ] Implement webhook idempotency using `stripe_event_id`.
- [ ] Sync subscription state to local billing tables.
- [ ] Enforce plan limits in backend (active seats + monthly events).
- [ ] Implement clear user-facing errors for limit violations.
- [ ] Add structured JSON logging in web and AI server.
- [ ] Add correlation IDs across ingestion and extraction flows.
- [ ] Track MVP metrics: ingestion_success_rate, extraction_success_rate, bot_task_creation_latency, failed_jobs_count.
- [ ] Define environment variable matrix (`local`, `preview`, `production`).
- [ ] Configure deployment targets (Vercel + managed AI container + Supabase).
- [ ] Configure CI: lint, typecheck, tests, schema validation.
- [ ] Block merge to main on CI failure.
- [ ] Document retention policy baseline for LGPD-oriented handling.
- [ ] Document incident response baseline (SEV levels and response flow).

Release checks:
- [ ] Landing page clearly communicates legal value and labor-cost reduction.
- [ ] Onboarding path from landing page to workspace creation is functional.
- [ ] Operational dashboard/runbook exists for failed ingestions and webhook issues.

M3 Gate (Go/No-Go):
- [ ] Stripe billing is live and synchronized via secure webhooks.
- [ ] Plan limits are enforced correctly.
- [ ] Critical errors are observable and actionable.
- [ ] MVP is deployment-ready in production environment.

---

## 6. Cross-Milestone Non-Negotiables

- [ ] Never bypass `workspace_id` scoping.
- [ ] Never expose secrets or tokens to frontend clients.
- [ ] Never allow AI server direct DB writes.
- [ ] Always append audit events for critical actions.
- [ ] Keep docs in sync when architecture/security/schema changes.

---

## 7. Suggested Execution Sequence (Weekly)

- Week 1-2: M1 core schema + auth + board/task UX + audit.
- Week 3-4: M2 ingestion + AI extraction + routing + idempotency.
- Week 5: M3 billing + observability + CI/CD + production hardening.

This sequence is a planning reference, not a hard deadline contract.
