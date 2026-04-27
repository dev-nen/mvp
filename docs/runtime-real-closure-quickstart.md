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
