# Vokos - Security Architecture

## 1. Scope and Security Posture

Vokos handles legal workflow data for Brazilian law firms.

Security principles:
- zero trust by default
- least privilege access
- strong tenant isolation
- immutable auditing for critical actions
- secret minimization and protected storage

## 2. Identity, Tenant, and Data Boundaries

System hierarchy:
- user -> organization -> workspace -> board -> list -> task

Boundary model:
- `organization` is the billing and membership boundary
- `workspace` is the operational data boundary for task domain entities

Isolation requirements:
- tenant domain tables include `workspace_id` where applicable
- organization-level tables include `organization_id`
- RLS is enabled for tenant tables
- all backend reads/writes are membership-scoped

## 3. Authentication and Access Gating

Auth provider:
- Supabase Auth

Access gating rules:
- account creation is free
- user cannot access app data without organization membership
- login routing must send users without memberships to `Create Organization`
- users with memberships must explicitly choose organization context

## 4. Authorization Model

### 4.1 MVP authorization
Only organization owner can:
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
- delete organization

Backend checks (mandatory):
- caller belongs to organization
- caller has access to workspace in organization
- action is allowed for caller role (owner/member)
- target entity belongs to same workspace and organization chain

### 4.2 V2 authorization roadmap (not implemented)
Planned granular permissions:
- create workspaces
- invite users
- remove users
- delete tasks
- manage boards

This requires advanced RBAC with permission grants per organization.

## 5. Invitation Security

Invitation flow security requirements:
- invite tokens are single-use, time-bound, and email-bound
- invitation acceptance validates token + email consistency
- membership writes are idempotent
- invite lifecycle events are audited (created, accepted, revoked, expired)

Edge cases:
- existing user email -> direct membership activation
- new user email -> post-signup auto-join into invited organization

## 6. Billing and Subscription Security

Rules:
- each organization has exactly one Stripe subscription
- Stripe is financial source of truth
- app mirrors Stripe state for authorization and limits

Webhook controls:
- verify Stripe webhook signature
- enforce idempotency with `stripe_event_id`
- persist processing status for replay-safe recovery
- reject unsigned or invalid signature events

## 7. Plan Limit Enforcement Security

Limits enforced per organization:
- users
- workspaces
- monitored processes

Security requirements:
- limit checks must run server-side before mutation
- do not trust client-provided counters
- prevent race conditions with transactional checks/locking strategy
- log and audit denied actions caused by plan limits

## 8. Service-to-Service Security (Web <-> AI)

Controls:
- signed short-lived internal token
- correlation id propagation
- explicit organization/workspace context in request payload
- strict schema validation on AI responses

Constraints:
- AI server does not write directly to database
- AI server does not access end-user sessions
- AI server does not hold customer mailbox write credentials

## 9. Mailbox and Ingestion Security

Non-negotiable rule:
- customer mailbox integrations are read-only

Forbidden capabilities:
- send email as customer identity
- reply as customer identity
- create/edit customer drafts

Prompt-injection handling:
- inbound communication is always untrusted
- instructions found in legal text are never executed as commands

## 10. Secrets and Sensitive Data

Rules:
- secrets stay in managed env/secret stores only
- no secrets in repo, docs, logs, PRs, or commit messages
- frontend must never receive integration credentials

Logging controls:
- redact sensitive payload fragments
- never log tokens, API keys, or full raw legal documents

## 11. Audit and Forensics

Audit requirements:
- append-only audit stream for critical mutations
- include actor, organization/workspace context, action, and timestamp

Minimum audited events:
- workspace creation
- member invite/remove
- task create/update/move/delete
- subscription status changes
- plan limit enforcement denials

## 12. Incident Readiness

Minimum protocol:
- classify severity (SEV1/SEV2/SEV3)
- isolate affected boundary (auth, billing, ingestion, data)
- preserve logs + audit data
- rotate impacted credentials
- document timeline and remediation
