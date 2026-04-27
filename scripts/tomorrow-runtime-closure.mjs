const summary = String.raw`
NensGo runtime closure - next tiny step

1. Run:
   npm.cmd run report:runtime

2. Read the generated report:
   tests/evidence/runtime-closure-latest.md

3. If report:runtime passes, Gate 1 stays closed.

4. Run the next non-browser automation:
   npm.cmd run gate2:check

5. Next human checkpoint is Gate 2:
   - Supabase Auth providers
   - redirect URLs
   - email verification
   - Vercel env vars/secrets
   - preview redeploy

6. If you do not have energy for external config, stop here.

7. Optional PVI authorized-path check:
   set INTERNAL_PVI_API_TOKEN locally and rerun:
   npm.cmd run report:runtime

8. After Gate 2 is done, run:
   npm.cmd run gate3:audit

9. For Gate 3 SQL blocks:
   npm.cmd run gate3:sql -- --email=<USER_EMAIL>
   npm.cmd run gate3:sql -- --user-id=<USER_UUID>

10. Send Codex only summaries, WARN/FAIL lines, or SQL errors.

Interpretation:
- If check:preview says Vercel Authentication protects the preview, that is OK.
- If get_internal_pvi_report is exposed to anon, stop and send Codex the output.
- Do not seed drafts yet.
- Do not run full smoke yet.
- Do not start Scout or Assisted Publishing work.
`;

console.log(summary.trim());
