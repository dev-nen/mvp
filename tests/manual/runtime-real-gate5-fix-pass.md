# Gate 5 Fix Pass

## Purpose

Gate 5 is only for gaps discovered by Gate 4. It is not a new feature phase.

Generate the current fix-pass reading with:

```powershell
npm.cmd run gate5:prep
```

Then open:

```txt
tests/evidence/gate5-fix-pass-plan-latest.md
```

## Decision Checklist

- [ ] Gate 4 Block 5 has evidence.
- [ ] Any Fail is classified as repo bug, data gap, config gap, external drift, or UX/copy regression.
- [ ] No fake data or frontend workaround is introduced to hide missing Supabase data.
- [ ] If a code fix is required, it is batched by subsystem.
- [ ] If no code fix is required, Gate 6 can start.

## Current Expected Non-Code Items

- Multi-contact chooser remains blocked until the dataset has a public activity
  with multiple active contact options.
- Preview-protected authorized PVI may remain blocked by Vercel Authentication
  unless an unprotected preview or production-like URL is used.
- Catalog freshness after internal publish/unpublish is tracked as debt, not a
  blocker for the lifecycle contract.

## Summary To Send Codex

```txt
Gate 5 fix-pass decision:
Code fix required: Yes / No
Blocked by data/config:
Issues to defer:
Ready for Gate 6: Yes / No
```
