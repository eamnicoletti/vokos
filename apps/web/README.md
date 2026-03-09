# @vokos/web

Next.js App Router app for M1 foundation.

Responsibilities:
- Authenticated workspace UI
- Kanban board/list/task interactions
- Server actions with workspace-scoped writes
- Audit event writes for critical task mutations
- Sonner feedback for user-facing async flows

Important constraints:
- Multi-tenant scoping by `workspace_id`
- No secrets in client-side code
- Design tokens follow shadcn `neutral` baseline
