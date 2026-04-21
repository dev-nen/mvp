# Project State

## Documentation Scope Note

This documentation reflects the current checked-out working state of
`feat/real-db-auth-migration`.
Baseline checked on April 21, 2026 against the active branch working tree.
Where implementation is partial or externally blocked, the active branch state
takes precedence over older `main` docs and chat history.

## What NensGo Is Today In This Branch

NensGo is currently a frontend MVP that has moved into a real DB and auth
migration checkpoint. The branch already contains:

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
- A public `/pvi` placeholder that no longer reads analytics in the browser
- A private `/api/internal/pvi` path intended for PO and DEV reporting

This branch is no longer using local catalog mocks as runtime truth for primary
paths.

## Current Stage

The current branch is best described as:

- A compiled implementation checkpoint of the real DB and auth migration
- Runtime code aligned to the new Supabase contracts
- Still partially blocked on external readiness and end-to-end validation

The branch compiles locally, but full readiness still depends on:

- applying the repo-tracked SQL in Supabase
- configuring Supabase Auth providers and email verification
- configuring Vercel server secrets
- validating real preview/production flows

## Currently Operational In The Active Branch

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
- `/pvi` remains routable in the public app only as a non-operational internal
  placeholder.
- `api/internal/pvi` exists as the intended private reporting path for PO and
  DEV.

## Partial Or Configuration-Dependent Areas

- The branch has not yet been validated against a live Supabase project with the
  new SQL applied.
- The expanded auth flow depends on external Supabase provider setup, redirect
  URLs, and email verification configuration.
- `ensure_my_profile(...)` is versioned in repo, but still requires human
  application and validation in Supabase.
- The internal metrics API requires Vercel secrets that are not validated from
  inside the repo alone.
- Detail is still intentionally split across Home modal and Favorites routed
  detail page.
- `/pvi` is intentionally not an operational dashboard in the public app during
  this phase.

## Difference Between Present Branch State, External Readiness, And Later Product Work

### Present state in `feat/real-db-auth-migration`

- Runtime contracts have moved to Supabase-backed data and auth boundaries.
- Local catalog fallback is no longer the primary product truth.
- Favorites are modeled as remote user data.
- Browser-side analytics dashboard reads have been retired.

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

This branch is not a mock-backed MVP anymore. It is a real DB and auth migration
checkpoint with compiled runtime changes already in place. It is also not yet
fully closed: external Supabase and Vercel readiness still gate the move from
implemented code to validated product behavior.
