# Real DB And Auth Migration Runbook

## Scope

This runbook covers the external setup required by the real DB and auth
migration implemented on `feat/real-db-auth-migration`.

It is intentionally short and operational. It does not replace the migration
SDD or the closed-decisions document.

## 1. Apply Supabase SQL

Apply:

- [`supabase/sql/2026-04-21_real_db_auth_phase.sql`](../supabase/sql/2026-04-21_real_db_auth_phase.sql)

This script is expected to create or update:

- `public.catalog_activities_read`
- `public.ensure_my_profile(text, text, bigint)`
- `public.get_internal_pvi_report()`
- sequence/default readiness for:
  - `activity_view_events.id`
  - `activity_contact_events.id`
  - `user_favorite_activities.id`
- unique indexes for:
  - `user_profiles.email`
  - `user_favorite_activities(user_profile_id, activity_id)`

## 2. Validate Supabase Readiness

Confirm all of the following before end-to-end validation:

- `select * from public.catalog_activities_read limit 5;`
- `select public.get_internal_pvi_report();`
- `select proname from pg_proc where proname = 'ensure_my_profile';`
- inserts into:
  - `public.activity_view_events`
  - `public.activity_contact_events`
  - `public.user_favorite_activities`
- duplicate favorite inserts are rejected by the unique index

## 3. Configure Supabase Auth

Enable and verify:

- Google provider
- email/password provider
- email confirmation for classic sign-up

Add redirect URLs for:

- local development
- Vercel preview deployment
- Vercel production deployment

## 4. Configure Vercel Env Vars

Client-side:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_PVI_API_TOKEN`

Redeploy after env changes.

## 5. Manual Validation Checklist

- anonymous catalog loads from real DB
- Google login works
- classic sign-up sends verification email
- verified classic user can complete onboarding
- `ensure_my_profile(...)` creates or updates `user_profiles`
- favorites persist remotely across reloads
- detail contact CTA handles:
  - one option
  - multiple options
  - zero options
- `activity_view_events` writes on detail open
- `activity_contact_events` writes on contact action
- `/pvi` in the public app shows internal-only placeholder content
- `GET /api/internal/pvi`:
  - returns `401` or `403` without valid bearer token
  - returns structured metrics with a valid bearer token
