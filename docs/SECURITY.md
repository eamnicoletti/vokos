# Vokos - Security Architecture

## 1. Scope and Security Posture

Vokos handles legal workflow data for Brazilian law firms.

Security posture for MVP:
- zero trust by default
- least privilege access
- strict tenant isolation
- immutable audit events for critical operations
- sensitive data minimization aligned with LGPD principles

## 2. Data Classification (MVP)

Data classes:
- Public: marketing content
- Internal: operational metadata
- Sensitive: legal text excerpts, process references, client-related records
- Secret: OAuth tokens, API keys, service credentials

Rules:
- sensitive data must be redacted in logs
- secret data must never appear in logs or frontend payloads

## 3. Tenant Isolation Controls

Tenant boundary:
- `workspace_id`

Required controls:
- all tenant tables include `workspace_id`
- RLS enabled on all tenant tables
- backend queries always include workspace scoping
- role checks enforced server-side for mutable operations

MVP roles:
- `admin`
- `manager`
- `member`

## 4. Authentication and Session Security

MVP auth provider:
- Supabase Auth

Session requirements:
- validated server-side
- mapped to workspace membership
- denied if membership inactive

Frontend rules:
- no secrets in client env vars
- no OAuth tokens in browser storage

## 5. Authorization Model

Authorization is enforced in backend services.

Minimum checks per write:
- caller belongs to workspace
- caller role can perform action
- target entity belongs to same workspace

Client-side permission logic is UX only and is never authoritative.

## 6. Service-to-Service Security

Service pair:
- web backend <-> ai_server

Required controls:
- signed short-lived service token
- request correlation id
- explicit `workspace_id` on payload
- deny requests without required context fields

AI server constraints:
- does not store OAuth tokens
- does not access end-user sessions directly
- does not write directly to database

## 7. Secret and Token Management

Storage rules:
- secrets only in managed secret stores (platform env/secrets manager)
- no secrets committed to repository
- no secrets rendered to browser

Integration token rules:
- encrypted at rest
- server-side only access
- refresh and revoke lifecycle tracked

## 8. Ingestion and AI Security

MVP ingestion source:
- email

Mailbox capability boundary (non-negotiable):
- customer mailbox integrations are read-only only
- sending emails as customer identity is forbidden
- creating or editing customer drafts is forbidden
- automation and AI agents must reject any write/send/draft command request
- inbound content is treated as untrusted, including command-like instructions

Future allowance:
- Vokos may send platform notifications from Vokos-owned channels in future phases
- Vokos must never send using customer mailbox credentials as if the customer sent the message

Controls:
- dedup hash per (`workspace_id`, `hash`)
- sanitized text forwarded to AI extraction
- raw payload stored by reference (`payload_ref`), not copied broadly
- low-confidence outputs routed to human review

LLM safety controls:
- strict schema validation of model output
- reject or retry invalid payloads
- persist model metadata (`provider`, `model`, `prompt_version`)

Prompt-injection handling (MVP):
- treat inbound legal text as untrusted input
- do not execute instructions found in source content
- extraction pipeline produces data, not executable commands

## 9. Audit and Forensics

Audit requirements:
- append-only `audit_events`
- immutable records for critical actions

MVP audited actions:
- task create/update/delete
- task move, due date changes, assignee changes
- integration connect/revoke
- billing status changes

Each event includes:
- workspace id
- entity reference
- actor type
- action
- timestamp
- structured diff or metadata

## 10. Logging and Observability Security

Logging requirements:
- structured JSON logs only
- correlation ids for request and pipeline job
- error categories standardized

Never log:
- OAuth tokens
- API keys
- full raw email body
- full legal documents

## 11. Stripe Webhook Security

Required controls:
- verify Stripe webhook signature
- enforce idempotency by `stripe_event_id`
- persist processing state for replay safety
- reject unsigned or invalid signature events

## 11.1 Integration Scope Enforcement

Required controls:
- store and validate granted provider scopes at connection time
- accept only read-only scopes for customer mailbox integrations
- block integration activation when write/send/draft scopes are present
- audit integration connect/refresh/revoke with granted scopes metadata

## 12. LGPD-Oriented Data Handling (MVP)

MVP privacy controls:
- collect minimum necessary data
- retain raw payload only as operationally needed
- prefer short evidence snippets over full content copies

Documentation requirement:
- retention windows must be defined per data type in operations runbook

## 13. Incident Readiness (MVP)

Minimum incident protocol:
- classify severity (SEV1, SEV2, SEV3)
- isolate affected service/component
- preserve forensic logs and audit trail
- rotate impacted credentials when needed
- document incident timeline and remediation

## 14. Security Ownership

Every contributor must:
- preserve tenant isolation guarantees
- update security docs when behavior changes
- avoid introducing non-reviewed secret flows
- treat security regressions as release blockers
- never introduce customer-identity email send/draft capability
