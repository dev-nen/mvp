const summary = String.raw`
NensGo runtime closure - next tiny step

1. Run:
   npm.cmd run check

2. If it passes, open Supabase project:
   xgvsinjbvsohnreifxcj

3. Gate 1A only:
   Apply the full file:
   supabase/sql/2026-04-21_real_db_auth_phase.sql

4. Print validation queries:
   npm.cmd run gate1:queries

5. Copy only the Gate 1A queries into Supabase SQL Editor.

6. Send Codex:
   - whether the SQL apply succeeded
   - the Gate 1A query results
   - any exact error text

7. Optional read-only check after apply:
   npm.cmd run check:preview

Interpretation:
- If check:preview says Vercel Authentication protects the preview, that is OK.
- If get_internal_pvi_report is still exposed to anon after Gate 1A, stop and send Codex the output.
- Do not seed drafts yet.
- Do not run full smoke yet.
- Do not start Scout or Assisted Publishing work.
`;

console.log(summary.trim());
