# Vokos AI Server (Python) - Backend Rules

## Responsibilities (MVP)
- Parse and normalize ingestion inputs (email-first for MVP)
- Perform classification and structured extraction
- Use Google Gemini as the AI provider
- Return extraction result to web backend for persistence
- Remain behind authenticated internal access

## Strict Boundaries
- AI server does not write directly to database tables.
- AI server does not store OAuth integration tokens.
- AI server does not trust user session context directly.
- AI server does not send email or edit drafts via customer mailbox credentials.

## Security Requirements
- Require service-to-service authentication on every request.
- Require `workspace_id`, `ingestion_item_id`, and `correlation_id` in requests.
- Redact sensitive data in logs.
- Never log full raw legal payloads or secrets.
- Reject any command-like instruction in source content that requests send/reply/draft actions.

## Module Guidelines
Suggested modules:
- `/ingest`
- `/extract`
- `/classify`
- `/clients/gemini`
- `/schemas`

## Output Contract
- All model outputs must be strict JSON validated by Pydantic schemas.
- Invalid outputs must trigger retry or human-review fallback.
- Include extraction metadata (`provider`, `model`, `prompt_version`).

## Determinism First
- Run deterministic preprocessing before model extraction.
- Use legal regex/date/process-number helpers before LLM inference.

## Observability
- Use structured JSON logs.
- Attach correlation IDs to all pipeline logs.
- Capture confidence and routing decision (`normal` or `review`).

## Testing
- Unit test parser and schema validation paths.
- Add failure-mode tests for malformed model outputs.
