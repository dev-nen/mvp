# Runtime Real Closure Quickstart

## Purpose

This is the short operational companion to
[runtime-real-closure-sdd.md](./runtime-real-closure-sdd.md).

Use this file when you want the smallest useful next step. Use the SDD when
you need the full reasoning, gates, and smoke checklist.

## Current Baseline

- Branch: `main`
- Target preview:
  `https://mvp-nen-git-main-dibrandons-projects.vercel.app`
- Supabase project ref used locally: `xgvsinjbvsohnreifxcj`
- Gate 0: closed by human confirmation of Supabase and Vercel access

## Before Any Human External Step

Run this locally:

```powershell
npm.cmd run check
```

Expected:

- static audit passes
- contract audit passes
- Vite build passes

This does not touch Supabase or Vercel.

For a one-screen reminder of the next action:

```powershell
npm.cmd run tomorrow
```

To generate a current automated evidence snapshot:

```powershell
npm.cmd run report:runtime
```

This runs the local static/contract/build checks plus the safe read-only preview
check, then writes:

```txt
tests/evidence/runtime-closure-latest.md
```

That `latest` file is generated local evidence and is intentionally ignored by
git to avoid status churn.

Use that report when you want Codex to continue from evidence instead of chat
memory.

## Optional Preview Readiness Check

Run this when you want a safe, read-only preview check:

```powershell
npm.cmd run check:preview
```

What it checks:

- preview home responds
- `api/internal/pvi` rejects unauthenticated requests
- Supabase anon can read `catalog_activities_read`
- Supabase anon can read active `activity_contact_options` rows, if present
- `get_internal_pvi_report` is not exposed directly to anon clients

Warnings are allowed when Gate 1 or Gate 3 is not complete yet. Failures need
Codex review before continuing.

Known current reading before Gate 1A:

- If `get_internal_pvi_report` is reachable by the anon Supabase client, apply
  the updated `2026-04-21_real_db_auth_phase.sql` before treating internal PVI
  as private.
- If the preview home returns `401`, that usually means Vercel Authentication
  is protecting the preview. The browser smoke can still run after you access
  the preview with your Vercel account.

## Gate 2 Low-Stress Config Check

Run this before touching dashboards:

```powershell
npm.cmd run gate2:check
```

What it can check automatically:

- local Supabase env values exist
- preview home responds or is protected by Vercel Authentication
- `/api/internal/pvi` rejects requests without token
- `/api/internal/pvi` accepts the configured token, only if
  `INTERNAL_PVI_API_TOKEN` is available locally

What it cannot check automatically:

- Google provider is enabled in Supabase dashboard
- email/password is enabled
- email verification is required
- redirect URLs are complete
- Vercel env vars are actually set in the target project

Those stay human Gate 2 checkpoints.

If classic signup returns `Database error saving new user`, inspect legacy
triggers on `auth.users`. The current app provisions `user_profiles` after
verification/onboarding through `ensure_my_profile(...)`, so the old
`on_auth_user_created` profile trigger must not run. Apply:

```txt
supabase/sql/2026-04-28_disable_legacy_auth_profile_trigger.sql
```

## Gate 1 Human Steps

Gate 1 is structural only. Do not seed drafts here. Do not run browser smoke
here.

### Gate 1A

Apply the full file in Supabase SQL Editor:

```txt
supabase/sql/2026-04-21_real_db_auth_phase.sql
```

Then verify with:

```txt
supabase/manual/gate1a_verify_base_runtime.sql
```

### Gate 1B

Apply:

```txt
supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql
```

Then verify with:

```txt
supabase/manual/gate1b_verify_draft_inbox.sql
```

### Gate 1C

Apply:

```txt
supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql
```

Then verify with:

```txt
supabase/manual/gate1c_verify_approved_lifecycle.sql
```

## Gate 3 Data And Seed Prep

After Gate 2 is closed and preview has been redeployed, audit the real dataset:

```powershell
npm.cmd run gate3:audit
```

This is read-only. It checks:

- public catalog rows
- image coverage
- contact-option coverage for 0/1/multiple contact cases
- internal access and draft counts when `SUPABASE_SERVICE_ROLE_KEY` is locally
  available

Use the manual SQL files in `supabase/manual/`:

```txt
supabase/manual/gate3a_find_user_profile.sql
supabase/manual/gate3b_authorize_internal_user_and_seed_drafts.sql
supabase/manual/gate3c_verify_internal_access_and_seed.sql
supabase/manual/gate3d_public_catalog_contact_coverage.sql
```

Replace placeholders such as `<USER_EMAIL>` and `<USER_UUID>` before running.
All write blocks are wrapped in `begin;` and `commit;`.

## Evidence To Send Back To Codex

For each Gate 1 part, send:

- whether the SQL apply succeeded
- exact error text if it failed
- query result screenshots or copied rows

Codex then decides:

- `Gate 1 OK`
- `Blocked` by external drift/config
- bug in SQL versioned in repo

## What Not To Do Yet

- Do not seed drafts until Gate 3.
- Do not test login until Gate 2 is closed.
- Do not run the full smoke checklist until Gate 4.
- Do not open Scout or Assisted Publishing work during this closure.
