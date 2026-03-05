# Vokos Web (Next.js) - Frontend Rules

## Framework
- Next.js App Router
- TypeScript
- TailwindCSS + shadcn/ui
- Outfit via `next/font/google`

## Product Context
- UX is focused on Brazilian legal teams.
- Language and copy should prioritize clear legal operations communication.

## Core UI Patterns
- Kanban board with lists and draggable tasks
- Task detail side panel with editable fields
- Task detail includes audit history and comments
- Always support loading, empty, and error states

## Styling Rules
- Use Tailwind utilities first.
- Keep custom CSS minimal and scoped.
- Do not introduce another UI component library.

## Data and Mutations
- Prefer Server Actions for writes.
- Use API routes only for external callbacks/webhooks or explicit integration needs.
- All workspace data interactions must be tenant-scoped.

## Forms and Validation
- Use zod for schema validation.
- Use react-hook-form for complex forms.
- Show user-friendly validation feedback.

## Accessibility
- Ensure keyboard support for dialogs and board interactions.
- Use semantic labels and aria attributes.

## Performance
- Avoid rendering large boards without optimization.
- Use optimistic updates only with rollback safeguards.

## File Conventions
- Components: `apps/web/components/*`
- Features: `apps/web/features/*`
- Server actions: `apps/web/app/**/actions.ts`
- API routes: `apps/web/app/api/**`

## Comments in Code
- Write comments in English.

