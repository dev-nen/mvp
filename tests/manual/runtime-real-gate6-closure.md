# Gate 6 Runtime Closure

## Purpose

Gate 6 closes the runtime-real effort only after the repo, preview behavior,
manual evidence, and known blockers tell the same story.

Generate the closure candidate with:

```powershell
npm.cmd run gate6:prep
```

Then open:

```txt
tests/evidence/gate6-closure-candidate-latest.md
```

## Closure Checklist

- [ ] `npm.cmd run check` passes.
- [ ] `npm.cmd run gate3:audit` has no unexpected Fail.
- [ ] `npm.cmd run gate4:metrics` has no privacy Fail.
- [ ] Gate 4 Block 5 has human evidence.
- [ ] Gate 5 says no code fix is required, or all required fix batches are done.
- [ ] Multi-contact remains documented as data-blocked or has been tested with real data.
- [ ] Test activity `#7` remains unpublished unless intentionally reopened.
- [ ] Docs/evidence are committed.
- [ ] Branch can be merged into `main`.

## Merge Recommendation

If the branch is accepted as-is and you want Git Graph to show the integration
branch clearly:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff codex/gate2-gate3-prep
git push origin main
```

Do not squash this branch if you want to preserve the gate/evidence commits.

## Summary To Send Codex

```txt
Gate 6 closure:
check: Pass / Fail
gate3:audit: Pass / Warn / Fail
gate4:metrics: Pass / Blocked / Fail
Remaining Blocked:
Ready to merge to main: Yes / No
```
