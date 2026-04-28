const summary = String.raw`
NensGo runtime closure - next tiny step

1. Run:
   npm.cmd run report:runtime

2. Read the generated report:
   tests/evidence/runtime-closure-latest.md

3. Run the current non-browser data audit:
   npm.cmd run gate3:audit

4. Prepare the current human smoke session:
   npm.cmd run gate4:prep

5. Open the generated Gate 4 session sheet:
   tests/evidence/gate4-smoke-session-latest.md

6. Prepare the remaining Gate 4 Block 5 internal-metrics check:
   npm.cmd run gate4:metrics

7. Open:
   tests/evidence/gate4-block5-internal-metrics-latest.md

8. After Block 5, prepare the fix-pass decision:
   npm.cmd run gate5:prep

9. Open:
   tests/evidence/gate5-fix-pass-plan-latest.md

10. If no code fix is required, prepare the closure candidate:
   npm.cmd run gate6:prep

11. Open:
   tests/evidence/gate6-closure-candidate-latest.md

12. If you need manual Supabase SQL, copy it only from:
   supabase/manual/README.md

13. Current expected Gate 3 warnings:
   - contact zero-option case may be missing
   - contact multi-option case may be missing

14. Current remaining human work:
   - Gate 4 Block 5 internal metrics
   - Gate 5 decision: fix required or not
   - Gate 6 closure confirmation

15. Optional Gate 2 recheck:
   npm.cmd run gate2:check

16. Optional PVI authorized-path check:
   set INTERNAL_PVI_API_TOKEN locally and rerun:
   npm.cmd run gate4:metrics

17. Send Codex only summaries, WARN/FAIL lines, or SQL errors.

Interpretation:
- If check:preview says Vercel Authentication protects the preview, that is OK.
- If get_internal_pvi_report is exposed to anon, stop and send Codex the output.
- Do not copy SQL from scripts or chat; use supabase/manual/.
- Do not start Scout or Assisted Publishing work.
- If Gate 4 Block 5 is blocked by Vercel Authentication, mark it as Blocked by preview protection, not as a repo bug.
`;

console.log(summary.trim());
