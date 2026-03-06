# Vokos - Database Schema (MVP)

## 1. Scope

This document defines the MVP data model for Vokos using:
- Supabase Auth
- Postgres
- Row Level Security (RLS)
- Stripe billing synchronization

Source alignment:
- `docs/MVP_ARCHITECTURE_BASELINE_V1.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`

## 2. Global Rules

Mandatory rules:
- all tenant domain tables include `workspace_id uuid not null`
- all tenant domain tables run with RLS enabled
- all app queries are workspace-scoped
- audit events are append-only

Naming and data conventions:
- `id uuid` primary keys
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()` where mutable

## 3. Enums

Recommended enums:
- `workspace_role`: `admin`, `manager`, `member`
- `created_by_type`: `human`, `bot`, `system`
- `source_type`: `manual`, `email`, `dje`, `portal`
- `ingestion_status`: `new`, `processing`, `processed`, `failed`, `ignored`
- `task_priority`: `low`, `medium`, `high`, `urgent`

## 4. Core Tenant Tables

### 4.1 workspaces
Fields:
- `id`
- `name`
- `slug` (unique)
- `owner_user_id` -> `auth.users.id`
- timestamps

Indexes:
- unique(`slug`)
- index(`owner_user_id`)

### 4.2 workspace_members
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `user_id` -> `auth.users.id`
- `role workspace_role`
- `is_active boolean default true`
- `invited_by_user_id` (nullable)
- timestamps

Constraints and indexes:
- unique(`workspace_id`, `user_id`)
- index(`user_id`)
- index(`workspace_id`, `role`)

### 4.3 projects
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `name`
- `description` (nullable)
- `client_name` (nullable)
- `is_archived boolean default false`
- `created_by_user_id` (nullable)
- timestamps

Indexes:
- index(`workspace_id`)
- index(`workspace_id`, `is_archived`)

### 4.4 boards
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `project_id` -> `projects.id`
- `name`
- `description` (nullable)
- `is_default boolean default false`
- `created_by_user_id` (nullable)
- timestamps

Indexes:
- index(`workspace_id`)
- index(`project_id`)

### 4.5 lists
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `board_id` -> `boards.id`
- `name`
- `position int`
- `is_archived boolean default false`
- timestamps

Constraints and indexes:
- unique(`board_id`, `position`)
- index(`workspace_id`, `board_id`)

### 4.6 tasks
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `project_id` -> `projects.id`
- `board_id` -> `boards.id`
- `list_id` -> `lists.id`
- `title`
- `description` (nullable)
- `position numeric default 1000`
- `due_date` (nullable)
- `priority task_priority` (nullable)
- `assignee_user_id` (nullable)
- `is_archived boolean default false`
- `created_by_type created_by_type`
- `created_by_user_id` (nullable)
- `created_by_bot_id` (nullable)
- `source_type source_type default 'manual'`
- `source_ref_id` (nullable)
- `source_summary` (nullable)
- `confidence numeric` (nullable)
- `edited_count int default 0`
- `last_edited_at` (nullable)
- `last_edited_by_user_id` (nullable)
- timestamps

Indexes:
- index(`workspace_id`, `board_id`, `list_id`)
- index(`workspace_id`, `assignee_user_id`)
- index(`workspace_id`, `due_date`)
- index(`workspace_id`, `is_archived`)

Integrity rules:
- if `created_by_type='human'` then `created_by_user_id` is required
- bot-created tasks should have non-manual source
- relationship consistency checks must enforce same `workspace_id` across task/project/board/list

### 4.7 task_comments
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `task_id` -> `tasks.id`
- `author_user_id` -> `auth.users.id`
- `body text`
- timestamps

Indexes:
- index(`workspace_id`, `task_id`, `created_at`)

## 5. Automation and Integrations

### 5.1 ingestion_items
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `source_type source_type`
- `external_id` (nullable)
- `received_at`
- `status ingestion_status`
- `hash`
- `subject` (nullable)
- `from_address` (nullable)
- `to_address` (nullable)
- `payload_ref` (nullable)
- `text_preview` (nullable, redacted)
- `parsed_json jsonb` (nullable)
- `error_message` (nullable)
- `processed_at` (nullable)
- timestamps

Constraints and indexes:
- unique(`workspace_id`, `hash`)
- index(`workspace_id`, `status`, `received_at`)

### 5.2 integrations
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `provider`
- `status` (`active`, `revoked`, `error`)
- `created_by_user_id` (nullable)
- `connected_at` (nullable)
- `revoked_at` (nullable)
- `encrypted_access_token` (nullable)
- `encrypted_refresh_token` (nullable)
- `token_expires_at` (nullable)
- `token_scopes text[]` (nullable)
- `config_json jsonb` (nullable)
- `last_sync_at` (nullable)
- `last_error` (nullable)
- timestamps

Indexes:
- index(`workspace_id`, `provider`)

Rule:
- integration tokens are server-side only and never exposed to frontend clients.
- customer mailbox integrations must be read-only in `token_scopes`.
- integrations with send/write/draft scopes must not be activated.
- once credentials are stored, values are not returned to user-facing clients (write-only secret UX).

## 6. Audit

### 6.1 audit_events
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `entity_type`
- `entity_id`
- `action`
- `actor_type created_by_type`
- `actor_user_id` (nullable)
- `actor_bot_id` (nullable)
- `occurred_at`
- `diff_json jsonb` (nullable)
- `metadata jsonb` (nullable)

Indexes:
- index(`workspace_id`, `entity_type`, `entity_id`, `occurred_at desc`)
- index(`workspace_id`, `occurred_at desc`)

Immutability rule:
- prevent UPDATE/DELETE operations by policy or trigger.

## 7. Billing (Stripe Mirror)

### 7.1 billing_customers
Fields:
- `workspace_id` (pk, fk to `workspaces.id`)
- `stripe_customer_id` (unique)
- timestamps

### 7.2 billing_subscriptions
Fields:
- `id`
- `workspace_id` -> `workspaces.id`
- `stripe_subscription_id` (unique)
- `status`
- `stripe_price_id`
- `current_period_start` (nullable)
- `current_period_end` (nullable)
- `cancel_at_period_end boolean default false`
- `canceled_at` (nullable)
- `trial_end` (nullable)
- `metadata jsonb` (nullable)
- timestamps

Indexes:
- index(`workspace_id`, `status`)

### 7.3 billing_events
Fields:
- `id`
- `stripe_event_id` (unique)
- `type`
- `workspace_id` (nullable)
- `payload jsonb`
- `received_at`
- `processed_at` (nullable)
- `error` (nullable)

Purpose:
- webhook idempotency
- processing traceability

## 8. Relationship Integrity Requirements

The following relations must remain workspace-consistent:
- project belongs to same workspace as board
- board belongs to same workspace as list
- task workspace matches project, board, and list workspaces
- comment workspace matches task workspace

Enforcement options:
- database triggers (recommended)
- plus backend validation guards

## 9. RLS Baseline

RLS must be enabled in all tenant tables.

Recommended helper function pattern:
- `is_workspace_member(workspace_id)` using `auth.uid()` and active membership

Policy baseline per tenant table:
- `SELECT`: workspace member only
- `INSERT`: workspace member only (with check)
- `UPDATE/DELETE`: workspace member with backend role checks

MVP practical model:
- RLS guarantees tenant isolation
- backend enforces role-specific business authorization

## 10. Operational Requirements

Required triggers:
- auto-update `updated_at` on mutable tables
- optional audit trigger hardening after backend audit flow is stable

Required dedup behavior:
- ingestion dedup by (`workspace_id`, `hash`)

Required migration discipline:
- all schema changes must update this document and architecture/security docs when applicable

## 11. Post-MVP Extensions (Not in MVP)

- process entity expansion and legal timeline modeling
- task attachments and watchers
- DJE and tribunal portal ingestion models
- advanced automation rules
