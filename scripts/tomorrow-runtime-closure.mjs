const summary = String.raw`
NensGo runtime closure - next tiny step

1. Run:
   npm.cmd run report:runtime

2. Read the generated report:
   tests/evidence/runtime-closure-latest.md

3. If report:runtime passes, Gate 1 stays closed.

4. Next human checkpoint is Gate 2:
   - Supabase Auth providers
   - redirect URLs
   - email verification
   - Vercel env vars/secrets
   - preview redeploy

5. If you do not have energy for external config, stop here.

6. Optional PVI authorized-path check:
   set INTERNAL_PVI_API_TOKEN locally and rerun:
   npm.cmd run report:runtime

7. Send Codex only the report summary or any FAIL output.

Interpretation:
- If check:preview says Vercel Authentication protects the preview, that is OK.
- If get_internal_pvi_report is exposed to anon, stop and send Codex the output.
- Do not seed drafts yet.
- Do not run full smoke yet.
- Do not start Scout or Assisted Publishing work.
`;

console.log(summary.trim());
