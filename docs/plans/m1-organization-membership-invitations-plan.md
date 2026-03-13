# M1 Plan - Organization Membership and Invitations

Status: `done`  
Date: `2026-03-12`  
Scope: `M1`  
Owner model: `organization-first`

## 1. Objective

Implement a robust M1 membership flow so an organization owner can invite members by email, track pending invitations, resend or revoke invites safely, and onboard invited users into the correct organization context after signup or login.

This plan intentionally follows the current application model:
- membership boundary is `organization`
- operational data boundary is `workspace`
- MVP permission model is `owner/member`

## 2. Locked Decisions

- [x] Invitations are created at the `organization` level, not per workspace.
- [x] Only `owner` can invite, resend, revoke, or remove members in M1.
- [x] UI copy may say `Admin`, but backend authorization remains `owner/member`.
- [x] A wrong email is handled by `revoke + recreate`, never by editing the original invitation row in place.
- [x] Invitation tokens are single-use, time-bound, and email-bound.
- [x] Pending invitations are shown in UI separately from active members, even if the visual layout looks unified.
- [x] Existing users and new users use the same invitation acceptance link.
- [x] Accepting an invite with a different authenticated email must fail.
- [x] If the user is already an active member, invitation acceptance becomes idempotent and redirects into the app.
- [x] Invitation lifecycle must be audited: `created`, `resent`, `revoked`, `accepted`, `expired`.
- [x] Cooldown for resend is `60 seconds`.
- [x] Invitation expiration window is `7 days`.

## 3. Target User Flow

### 3.1 Owner flow

1. Owner opens organization members page.
2. Owner enters an email and sends an invitation.
3. Invitation appears in `Pending invitations`.
4. Pending invitation card/row shows:
- invited email
- inviter
- created time
- expiration time
- status badge
- resend action
- revoke action
- correct-email action
5. If the email was typed incorrectly, owner chooses `Correct and resend`.
6. System revokes the previous invitation and creates a new pending invitation with a fresh token.
7. Resend is blocked by cooldown for 60 seconds.

### 3.2 Invited user flow

1. User receives email with secure invitation link.
2. User clicks the link and lands on `/invite/accept`.
3. System validates token status and expiration.
4. If user has no session:
- signup page if account does not exist yet
- login page if account already exists
5. Email field should be prefilled when possible.
6. Token context must survive redirect through auth.
7. After signup or login, system resolves the invitation.
8. Membership is activated idempotently in `organization_members`.
9. User is redirected into the app within the invited organization context.
10. A welcome dialog confirms membership and encourages collaboration.

### 3.3 Post-acceptance dialog

Expected UX:
- title: `Agora voce faz parte de "<Organization Name>"`
- body: short collaboration-oriented message
- actions:
- `Abrir workspace`
- `Ver minhas tarefas`

## 4. UX and Product Requirements

- [x] Add a members management screen for the active organization.
- [x] Display two sections:
- `Active members`
- `Pending invitations`
- [ ] Show clear badges:
- `Pendente`
- `Reenviado`
- `Expirado`
- `Revogado`
- `Aceito`
- [x] Disable resend action during cooldown.
- [x] Show cooldown feedback in UI.
- [x] Show expiration timestamp in a readable format.
- [x] Surface empty states for:
- no members beyond owner
- no pending invitations
- invalid invite
- expired invite
- revoked invite
- already accepted invite
- [x] Replace the current placeholder action in sidebar with navigation to the real membership flow.
- [x] Add post-acceptance success dialog after login/signup resolution.

## 5. Data Model and Persistence

### 5.1 Required tables

- [x] Ensure `organization_invitations` exists in database schema.
- [x] Required fields:
- `id`
- `organization_id`
- `email`
- `invited_by_user_id`
- `token_hash`
- `status`
- `expires_at`
- `accepted_at`
- `accepted_user_id`
- timestamps

### 5.2 Required constraints

- [x] Unique pending invitation per `organization_id + email`.
- [x] Index by `organization_id + status`.
- [x] Index by normalized email.
- [x] Store only token hash, never raw token.
- [x] Normalize emails before persistence and comparison.

### 5.3 Membership writes

- [x] Invitation acceptance must upsert or activate `organization_members`.
- [x] Membership creation must be idempotent.
- [x] Re-accepting an already accepted invite must not duplicate membership rows.

## 6. Backend Implementation Checklist

### 6.1 Server actions / endpoints

- [x] Create invite action.
- [x] Create resend invite action.
- [x] Create revoke invite action.
- [x] Create accept invite action.
- [x] Create list members + invitations query layer.
- [x] Add owner-only authorization checks.
- [x] Validate organization context on every mutation.

### 6.2 Business rules

- [x] Only `owner` can invite and manage invitations.
- [x] Resend before cooldown returns a controlled error.
- [x] Revoke only works for pending invitations.
- [x] Accept only works for pending and unexpired invitations.
- [x] Accept fails if authenticated email does not match invitation email.
- [x] Accept succeeds idempotently if membership already exists and is active.
- [x] Expired invitations cannot be accepted.
- [x] Revoked invitations cannot be accepted.

### 6.3 Auth and redirect handling

- [x] Add invite acceptance route.
- [x] Preserve invite token across redirects to login/signup.
- [x] After auth, resolve invite before redirecting to the in-app destination.
- [x] Ensure invited user lands inside the invited organization context, not an arbitrary default context.

## 7. Email Delivery Checklist

Current implementation note:
- Resend is the transactional provider currently wired for invitation delivery.
- Local/testing may use `resend.dev`; production must switch to a verified domain sender.

- [x] Create invitation email template.
- [x] Include organization name in subject/body.
- [x] Include expiration information.
- [x] Include one primary CTA with invitation link.
- [x] Include fallback plain URL.
- [x] Avoid leaking token anywhere except the secure link.
- [x] Log email delivery failures without exposing token value.

## 8. Audit and Security Checklist

- [x] Audit event on invite creation.
- [x] Audit event on resend.
- [x] Audit event on revoke.
- [x] Audit event on accept.
- [x] Audit event on expiration handling if expiration is materialized or processed.
- [x] Enforce single-use token behavior.
- [x] Hash token before database write.
- [x] Compare normalized email from auth identity to invitation email.
- [x] Do not allow invitation acceptance under a different email.
- [x] Keep invitation acceptance idempotent.
- [x] Do not mutate original invitation email in place.

## 9. Frontend Implementation Checklist

### 9.1 Organization members page

- [x] Add page route for organization membership management.
- [x] Load active members and pending invitations.
- [x] Add invite form with email validation.
- [x] Add revoke action.
- [x] Add resend action.
- [x] Add correct-email flow that creates a replacement invite.
- [x] Add optimistic or fast refresh behavior after mutations.

### 9.2 Invitation acceptance flow

- [x] Add invite landing page for token validation.
- [x] Render proper state for:
- valid invite
- invalid token
- expired invite
- revoked invite
- accepted invite
- [x] Redirect unauthenticated users to login/signup with preserved token state.
- [x] Show post-acceptance welcome dialog inside the app shell.

## 10. Suggested Implementation Order

### Phase 1 - Schema and contracts

- [x] Add or align migration for `organization_invitations`.
- [x] Add shared status enums/types as needed.
- [x] Document final invite status transitions.

### Phase 2 - Backend mutation path

- [x] Implement create/resend/revoke/accept actions.
- [x] Implement token hashing and validation.
- [x] Implement idempotent member activation.
- [x] Implement audit writes for invitation lifecycle.

### Phase 3 - Members UI

- [x] Replace placeholder membership CTA.
- [x] Add members page with active/pending sections.
- [x] Add invite dialog/form and invitation row actions.

### Phase 4 - Acceptance UX

- [x] Add invite accept route.
- [x] Connect login/signup redirects to invitation resolution.
- [x] Add post-acceptance success dialog.

### Phase 5 - Hardening

- [ ] Add authorization tests.
- [ ] Add invite acceptance tests.
- [ ] Add cross-organization misuse tests.
- [ ] Review audit coverage and failure handling.

## 11. Testing Checklist

### 11.1 Unit tests

- [ ] Owner can create invite.
- [ ] Non-owner cannot create invite.
- [ ] Resend respects cooldown.
- [ ] Revoke changes invitation state correctly.
- [ ] Accept activates membership idempotently.
- [ ] Accept with mismatched email fails.
- [ ] Accept expired invite fails.
- [ ] Accept revoked invite fails.

## 12. Current Closure

Current assessment:
- core M1 invitation and membership flow is implemented end-to-end
- feature is considered complete for M1 delivery
- `Reenviado` remains supporting metadata, not a primary status badge
- automated tests are intentionally deferred to the post-MCP hardening phase

Deferred post-MCP items:
- add automated tests for authorization, acceptance flow, and cross-organization misuse

### 11.2 Integration tests

- [ ] Owner invites member and sees pending invitation in UI.
- [ ] Correct-email flow revokes old invite and creates new invite.
- [ ] Existing user accepts invite and lands inside correct organization.
- [ ] New user signs up through invite and is joined automatically.
- [ ] Already-active member reuses invite link and is redirected safely.
- [ ] Cross-organization acceptance attempt is blocked.

## 12. Acceptance Criteria

- [ ] Owner can invite a member by email.
- [ ] Pending invitations are visible in UI with correct status.
- [ ] Wrong email can be corrected safely by revoke + recreate flow.
- [ ] Resend is available with 60-second cooldown.
- [ ] Invite link works for both signup and login paths.
- [ ] Membership activation is idempotent.
- [ ] Invited user lands inside the correct organization context.
- [ ] Welcome dialog is shown after successful acceptance.
- [ ] All invitation lifecycle events are audited.
- [ ] Flow is covered by unit and integration tests.

## 13. Explicit Non-Goals for This Plan

- [ ] Granular RBAC beyond `owner/member`
- [ ] Workspace-specific invitation permissions
- [ ] Member self-service invite acceptance without email-bound validation
- [ ] Editing invitation email in place
- [ ] Full seat billing enforcement unless already implemented in organization plan logic

## 14. Notes for Implementation

- The current codebase still contains M1 checklist language referring to `admin`, `manager`, `member`, but runtime auth has already shifted to organization membership mapping. This plan follows the actual `organization-first` implementation and should be used to clean up that mismatch during delivery.
- The plan assumes the acceptance route can preserve invite context through auth redirects. If the current auth callback path cannot support this cleanly, fix that infrastructure before building the final invite UX.
