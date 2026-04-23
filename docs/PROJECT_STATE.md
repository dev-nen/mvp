# Project State

## Documentation Scope Note

This documentation reflects the current checked-out working state of `main`.
Baseline rechecked on April 23, 2026 after consolidating
`feat/real-db-auth-migration` and `feat/internal-draft-inbox` into `main`.
Where implementation is partial or externally blocked, the current repository
state of `main` takes precedence over older branch docs and chat history.

## What NensGo Is Today In `main`

NensGo is currently a frontend MVP that has moved into a real DB and auth
migration checkpoint plus the first internal Draft Inbox slice. `main` already
contains:

- A public landing and catalog experience on `/`
- A separate public B2B landing on `/para-centros`
- Protected routes for `/perfil`, `/favoritos`, and `/favoritos/:activityId`
- A Supabase-backed catalog read path through `catalog_activities_read`
- A Supabase-backed favorite model through `user_favorite_activities`
- An app-profile flow based on `public.user_profiles`
- Expanded auth UI for Google plus classic `email/password`
- Onboarding completion through a Supabase RPC instead of direct profile inserts
- Contact actions driven by `activity_contact_options`
- Analytics writes aligned to `activity_view_events` and `activity_contact_events`
- A first public-surface hardening pass that retires the former public `/pvi`
  placeholder and removes debug-like copy from user-facing surfaces
- A private `/api/internal/pvi` path intended for PO and DEV reporting
- Internal routes for `/internal/drafts` and `/internal/drafts/:draftId`
- An internal route for `/internal/activities/:activityId`
- A repo-tracked Draft Inbox SQL phase with:
  - `activity_drafts`
  - `internal_tool_access`
  - `approve_activity_draft(...)`
  - seed examples for one authorized internal user
- A repo-tracked approved-activity lifecycle SQL phase with:
  - `list_internal_approved_activity_states(...)`
  - `get_internal_approved_activity(...)`
  - `update_approved_activity_from_draft(...)`
  - `unpublish_approved_activity(...)`
  - `republish_approved_activity(...)`

`main` is no longer using local catalog mocks as runtime truth for primary
paths.

## Current Stage

`main` is best described as:

- A compiled implementation checkpoint of the real DB and auth migration
- A compiled implementation checkpoint of Draft Inbox Phase 1
- Runtime code aligned to the new Supabase contracts
- Still partially blocked on external readiness and end-to-end validation

`main` compiles locally, but full readiness still depends on:

- applying the repo-tracked SQL in Supabase
- configuring Supabase Auth providers and email verification
- configuring Vercel server secrets
- validating real preview/production flows

## Currently Operational In `main`

- Home acts as landing plus public catalog entry point.
- `/para-centros` still exists as a separate public B2B landing.
- Public catalog reads from Supabase through a dedicated read model instead of
  local fallback files.
- Catalog filters now treat `city_id` as persisted truth and derive slug only
  for UI-facing needs.
- Home detail modal and Favorites detail page both use
  `activity_contact_options` as the only contact source.
- Favorites are remote and user-linked instead of browser-local.
- Protected auth surfaces support Google sign-in, email/password sign-in,
  email/password sign-up, email verification messaging, and onboarding-required
  states.
- App-user truth now comes from `public.user_profiles`, not auth metadata.
- Email is treated as non-editable in this phase.
- Draft Inbox pages and guard now exist in the app for authorized internal
  users.
- Approved activities linked from Draft Inbox now have a dedicated internal page
  and internal edit/publish lifecycle in repo.
- The public app no longer exposes `/pvi`.
- `api/internal/pvi` exists as the intended private reporting path for PO and
  DEV.

## Partial Or Configuration-Dependent Areas

- `main` has not yet been validated against a live Supabase project with the
  new SQL applied.
- The expanded auth flow depends on external Supabase provider setup, redirect
  URLs, and email verification configuration.
- `ensure_my_profile(...)` is versioned in repo, but still requires human
  application and validation in Supabase.
- Draft Inbox still depends on:
  - applying `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql`
  - applying `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
  - granting one or more real internal users in `internal_tool_access`
  - running the draft seed helper against a real internal user id
- Approved activity lifecycle still depends on:
  - applying the phase 2 SQL
  - validating edit, unpublish, and republish against the real public catalog
- The internal metrics API requires Vercel secrets that are not validated from
  inside the repo alone.
- Detail is still intentionally split across Home modal and Favorites routed
  detail page.
- Public-surface hardening is only a first pass; the guardrail against
  debug-like public copy still needs to remain active in future work.

## Difference Between Present `main` State, External Readiness, And Later Product Work

### Present state in `main`

- Runtime contracts have moved to Supabase-backed data and auth boundaries.
- Local catalog fallback is no longer the primary product truth.
- Favorites are modeled as remote user data.
- Browser-side analytics dashboard reads have been retired.
- The public `/pvi` placeholder route is retired from the app.
- Internal editorial review now has a first route and data-contract slice in
  repo, but not yet validated live.

### External readiness still pending

- Supabase SQL application
- Auth provider configuration
- Vercel env and secret configuration
- Human-driven end-to-end verification

### Later product work

- Richer profile editing
- Account-linking or email-change flows
- Public or role-based metrics visibility
- Further role expansion beyond the current family-user baseline

## Current State Summary

`main` is not a mock-backed MVP anymore. It is a real DB and auth migration
checkpoint with an internal Draft Inbox plus approved-activity lifecycle
already added in repo, and with a first public-surface hardening pass already
landed. It is also not yet fully closed: external Supabase and Vercel readiness
still gate the move from implemented code to validated product behavior.
