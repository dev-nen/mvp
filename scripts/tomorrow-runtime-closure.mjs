const summary = String.raw`
NensGo runtime closure - next tiny step

1. Run:
   npm.cmd run report:runtime

2. Read the generated report:
   tests/evidence/runtime-closure-latest.md

3. Run the current non-browser data audit:
   npm.cmd run gate3:audit

4. If you need manual Supabase SQL, copy it only from:
   supabase/manual/README.md

5. Current expected Gate 3 warnings:
   - contact zero-option case may be missing
   - contact multi-option case may be missing

6. If Gate 3 audit has no FAIL, next human work is Gate 4 smoke by blocks:
   - Draft Inbox list
   - draft detail save/reject
   - approve one draft
   - approved lifecycle
   - public catalog/favorites/contact

7. Optional Gate 2 recheck:
   npm.cmd run gate2:check

8. Optional PVI authorized-path check:
   set INTERNAL_PVI_API_TOKEN locally and rerun:
   npm.cmd run report:runtime

9. Send Codex only summaries, WARN/FAIL lines, or SQL errors.

Interpretation:
- If check:preview says Vercel Authentication protects the preview, that is OK.
- If get_internal_pvi_report is exposed to anon, stop and send Codex the output.
- Do not copy SQL from scripts or chat; use supabase/manual/.
- Do not start Scout or Assisted Publishing work.
`;

console.log(summary.trim());
