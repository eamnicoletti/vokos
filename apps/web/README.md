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

Email configuration:
- Invitation e-mails are sent through Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are defined.
- `RESEND_FROM_EMAIL` should be a verified sender on your Resend domain, for example `Vokos <noreply@seudominio.com>`.
