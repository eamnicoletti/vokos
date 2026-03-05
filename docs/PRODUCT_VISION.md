# Vokos - Product Vision

## 1. Product Summary

Vokos is a legal productivity platform built for Brazilian lawyers and law firms.

The product combines:
- A Kanban task system for legal execution
- AI automation that transforms legal events into tasks

Primary goal:
- Reduce missed deadlines and operational risk in legal workflows.

## 2. Ideal Customer Profile (ICP)

Primary ICP:
- Brazilian solo lawyers
- Small and medium law firms in Brazil
- Teams that rely on email and publication monitoring for case updates

Secondary ICP (post-MVP):
- Larger firms with higher process volume and specialized legal operations teams

## 3. Core Problem

Legal teams lose time and reliability because important updates are fragmented across:
- email inboxes
- legal notifications
- process updates
- informal team communication

Result:
- delayed actions
- missed deadlines
- low traceability of who changed what and why
- high operational cost with repetitive manual triage work

## 4. Product Value Proposition

Vokos centralizes legal execution in one workspace and converts legal signals into actionable, auditable tasks.

Main value pillars:
- Reliability: less deadline risk
- Productivity: less manual triage
- Traceability: full audit trail per task
- Multi-tenant isolation: safe SaaS model for law firms
- Cost efficiency: less dependency on dedicated staff for email-to-task conversion

## 5. Product Model

Workspace (law firm)
-> Projects (case/client/matter)
-> Boards (Kanban boards)
-> Lists (columns)
-> Tasks (cards)

Tasks can be created by:
- humans
- bot (AI pipeline)
- system actions

## 6. MVP Scope (Locked)

MVP includes:
- Workspace and membership model
- Role-based access: `admin`, `manager`, `member`
- Kanban board with editable tasks
- Task origin metadata (`human|bot|system` + source)
- Audit history for critical actions
- Email ingestion pipeline
- AI extraction with Google Gemini
- Automatic task creation with confidence routing
- Supabase authentication
- Stripe billing
- Marketing landing page

## 7. Out of Scope for MVP

Explicitly post-MVP:
- Full DJE automation
- Tribunal portal automation
- Agent orchestration (OpenClaw)
- Advanced legal analytics and forecasting
- Complex workflow automation rules

## 8. UX Principles

- Fast operational flows for legal teams
- Minimal friction in task update and reassignment
- Explainable AI output with evidence snippets
- Audit visibility inside task detail
- Portuguese-first product communication for Brazilian users

## 9. Success Metrics (MVP)

Product metrics:
- Time from ingestion to task creation
- Percentage of ingestions converted into usable tasks
- Percentage of bot-created tasks accepted without major edits
- Active workspaces per week
- Operational hours saved in email triage per workspace

Operational metrics:
- Ingestion success rate
- Extraction success rate
- Failed job rate
- Mean time to recover failed ingestion jobs
- Reduction of manual email-to-task workload

## 10. Product Positioning

Vokos is not a generic task manager.

Positioning statement:
- "A legal operations platform that turns legal updates into actionable and auditable tasks for Brazilian law firms."

Business outcome statement:
- "Vokos reduces manual labor costs by automating the email-to-task workflow that often requires dedicated operational staff."
