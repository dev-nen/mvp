# Publisher Phase 4 validation and hardening

Status: In progress.

## Branch context

- Active branch: `feat/publisher-request-flow-phase4`.
- Starting commit: `86a3ef4`; clean working tree.
- Task size: L (Supabase permissions, private organizer data and review RPCs).
- Mode: discovery, bounded fix pack, independent review and validation.
- No comparison with or changes to `main` are part of this task.

## Current state

The request UI, internal review tab and activity-submission gate exist. The
previous handoff leaves live SQL application and QA pending. Current local
static/contract/contact checks and the Vite build pass, with existing vendor
chunk size and circular-chunk warnings.

Read-only review found two defects: table-wide SELECT grants expose internal
request notes to the requesting user, and three review RPCs use ambiguous
`review_status` column references alongside same-named output parameters.

## Goal

Fix those defects, exercise the migration with PostgreSQL locally, inspect the
connected deployment and Supabase state, and complete browser/live checks where
the required connection and test identities are available. Preserve an honest
separation between local evidence and external validation.

## Touched files

- `supabase/sql/2026-05-30_publisher_request_flow_phase4.sql`
- `supabase/sql/2026-09-18_publisher_request_review_hardening.sql`
- `scripts/publisher-request-sql-check.mjs`
- `package.json`
- `package-lock.json`
- `docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`
- `docs/02_TECHNICAL/SUPABASE_MODEL.md`
- `docs/03_OPERATIONS/QA/QA_HANDOFF_2026-05-28.md`
- This plan/evidence document.

## Out of scope

Product redesign, public organizer profiles, unrelated auth/catalog changes,
dependency upgrades, production test-data publication, and unrelated warnings.
No push or production deployment is implicit in the local fix pack.

## Risks and assumptions avoided

- The browser inventory currently returns no available Chrome connection.
- Vercel and Supabase target identity must be verified before external writes.
- Existing SQL files do not prove which migrations are applied remotely.
- Local PostgreSQL fixtures cannot establish live RLS, OAuth or UI correctness.
- Test identity creation must not silently grant privileges to real users.
- Keep secrets out of logs, test fixtures, screenshots and committed evidence.

## Implementation sequence

1. Inspect deployment identity and available browser/database access read-only.
2. Remove direct client table access; preserve sanitized user and internal RPCs.
3. Qualify review RPC column references without changing lifecycle semantics.
4. Provide an additive migration for environments with the original SQL applied.
5. Add isolated PostgreSQL regression checks for permissions and transitions.
6. Independently review the fix pack and run relevant repository checks.
7. Validate live/browser flows when access and target environment are established.
8. Record exact evidence, pending work and final git status; commit local changes.

## Validation

- Execute actual migration SQL in an isolated in-memory PostgreSQL instance.
- Cover submit, request changes, resubmit, reject and approve; safe user status;
  anon/non-internal/non-owner denial; no direct table access; publisher gate;
  migration reapplication and the additive hardening path.
- `npm.cmd run check` (includes build) and SQL regression command.
- `git diff --check` and `git diff --cached --check`.
- Read-only deployment inspection, then browser/Supabase smoke if connected.

## Pending after closure

Record any external check not performed explicitly; do not mark Phase 4 Done
without the corresponding live evidence.
