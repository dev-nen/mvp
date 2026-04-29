# Gate 4 Block 5 - Internal Metrics

## Context

- Date: 2026-04-29
- Branch: `codex/gate2-gate3-prep`
- Environment: Vercel preview
- Preview URL: `https://mvp-nen-git-main-dibrandons-projects.vercel.app`
- Scope: public `/pvi` retirement and private `api/internal/pvi` access behavior.

## Human Result

| Check | Result | Notes |
| --- | --- | --- |
| `/pvi` publico no existe y vuelve a Home o queda protegido | Pass | No public metrics dashboard was exposed. |
| `/api/internal/pvi` sin token rechaza | Pass | Unauthenticated request rejects. |
| `/api/internal/pvi` con token | Blocked | Vercel Authentication blocks the protected preview before the serverless endpoint. |

## Automated Prep Output

```txt
PASS static public /pvi route retired - src/App.jsx has no /pvi route or PviPage import.
PASS static PviPage files removed - src/pages/PviPage.* is absent.
WARN preview /pvi browser path - Blocked by Vercel Authentication in CLI; human browser check required.
PASS internal PVI rejects without token - 401 Unauthorized
WARN internal PVI with configured token - Blocked by Vercel Authentication before the serverless endpoint.
PASS get_internal_pvi_report anon RPC privacy - permission denied for function get_internal_pvi_report
```

## Reading

Gate 4 Block 5 is accepted for preview closure:

- Public `/pvi` remains retired.
- Unauthenticated `api/internal/pvi` does not leak private data.
- Direct anon Supabase RPC access to `get_internal_pvi_report` is denied.
- Authorized API-path validation remains `Blocked` by Vercel Authentication on the protected preview, not by a repo failure.
