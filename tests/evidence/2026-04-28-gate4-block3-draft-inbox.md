# Gate 4 Block 3 Draft Inbox Evidence

## Context

- Date: 2026-04-28
- Branch: `codex/gate2-gate3-prep`
- Environment: Vercel preview
- Tester state: authenticated internal user

## Human Result

```txt
1. /internal/drafts abre con usuario autorizado: Pass
2. Lista muestra drafts seed reales: Pass
3. Abrir draft id 2 funciona: Pass
4. Guardar una nota de revision en draft id 2 funciona y sobrevive refresh: Pass
5. Abrir draft id 7 funciona: Pass
6. Rechazar draft id 7 funciona: Pass
7. Draft id 7 queda read-only/rejected: Pass
```

## Evidence Notes

The list showed 6 visible drafts at the time of the run:

- Draft #7, seed-complete, rejected after this block
- Draft #8, seed-incomplete, pending
- Draft #9, seed-ambiguous, pending
- Draft #1, seed-complete, rejected
- Draft #2, seed-incomplete, pending
- Draft #3, seed-ambiguous, approved, linked to activity 6

The screenshot confirms Draft #7 in `Rechazado` state and read-only mode after
the rejection action.

## Gate Reading

Gate 4 Block 3 is `Done` for the tested preview environment.

Do not approve Draft #8 for the next block unless the required publish fields
are corrected first. Draft #9 is the safer current approval candidate from the
remaining pending seed set.
