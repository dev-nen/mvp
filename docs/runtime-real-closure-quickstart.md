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

## Gate 1 Human Steps

Gate 1 is structural only. Do not seed drafts here. Do not run browser smoke
here.

### Gate 1A

Apply the full file in Supabase SQL Editor:

```txt
supabase/sql/2026-04-21_real_db_auth_phase.sql
```

Then run:

```powershell
npm.cmd run gate1:queries
```

Copy only the Gate 1A queries into Supabase SQL Editor and return the results
or errors.

### Gate 1B

Apply:

```txt
supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql
```

Run the Gate 1B queries printed by `npm.cmd run gate1:queries`.

### Gate 1C

Apply:

```txt
supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql
```

Run the Gate 1C queries printed by `npm.cmd run gate1:queries`.

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

To print the SQL blocks for authorizing an internal user and seeding drafts:

```powershell
npm.cmd run gate3:sql -- --email=<USER_EMAIL>
npm.cmd run gate3:sql -- --user-id=<USER_UUID>
```

Use the email query first to find the app user id, then rerun with `--user-id`
and copy the relevant SQL blocks into Supabase SQL Editor.

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
