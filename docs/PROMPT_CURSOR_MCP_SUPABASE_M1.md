# Prompt - Cursor AI with Supabase MCP (M1)

Use this prompt in Cursor chat to execute M1 database setup directly on Supabase MCP.

```text
Use the Supabase MCP server and target project ID `soevdggwpfjrkojhwjuw`.

Goal:
Apply the M1 foundation SQL migration from this repository and verify schema + RLS + policies.

Steps:
1. Read the SQL file `supabase/migrations/0001_m1_foundation.sql` from the workspace.
2. Execute the entire SQL in project `soevdggwpfjrkojhwjuw`.
3. Run verification queries and return results:
   - List created tables in schema `public` for M1:
     `workspaces`, `workspace_members`, `projects`, `boards`, `lists`, `tasks`, `task_comments`, `audit_events`.
   - Confirm RLS is enabled for each of the tables above.
   - List all policies for those tables.
   - Confirm helper functions exist:
     `is_workspace_member`, `has_workspace_role`, `bootstrap_m1_workspace`.
4. If migration succeeded, execute this check query:
   `select proname from pg_proc where proname in ('is_workspace_member','has_workspace_role','bootstrap_m1_workspace');`
5. Do not create extra tables beyond migration file.
6. Do not relax security policies.

Optional seed (only if I provide a real auth user id):
- Execute `scripts/m1_seed.sql` replacing `USER_ID` with the provided UUID.

Return format:
- `status`: success/failure
- `migration_executed`: yes/no
- `tables_created`: list
- `rls_enabled`: per-table map
- `policies_count`: per-table map
- `notes`: any errors or follow-up actions
```
