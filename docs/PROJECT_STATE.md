# Project State

## Documentation Scope Note

This documentation reflects the current merged state of `main` at the time of writing.
Baseline checked on April 17, 2026 against `main` at HEAD `bff3c62`.
Where implementation is partial, branch history or feature-level docs may provide additional context, but the current repository state takes precedence over historical intent.

## What NensGo Is Today

NensGo is currently a frontend-first MVP for discovering activities for children and families. The repo already contains:

- A public landing and catalog experience on `/`
- Real client-side routing
- A fallback-driven activity catalog served from local frontend data
- A public teaser card contract for the catalog
- Favorites stored locally in the browser
- A split detail experience across Home modal and Favorites detail page
- Base auth integration with Supabase Auth and Google
- A minimal profile surface tied to current auth state
- An internal-style PVI dashboard that reads interaction events when Supabase is configured

This is not yet a full backend-backed product. The current runtime still mixes implemented frontend behavior, local fallback data, external-service seams, and future roadmap direction.

## Current Stage

The current merged baseline is best described as:

- A usable frontend MVP with real navigation and current user-facing surfaces
- A public catalog backed by local fallback data plus runtime enrichment
- Base auth integrated in code, but still dependent on external configuration
- Several MVP 2.0 lines started, but not all closed as full product phases

## Currently Operational In Main

- Branding baseline is NensGo across active surfaces and assets.
- Home acts as landing plus public catalog entry point.
- Public catalog supports search, filters, quick-access category entry points, and teaser cards.
- Public catalog cards apply current validity filtering and standard placeholder fallback behavior.
- Users can save favorites locally and revisit them on `/favoritos`.
- Home can open a detail modal after passing the current protected-action flow.
- Favorites can open a dedicated detail page on `/favoritos/:activityId`.
- Profile route exists and shows the current auth/session state.
- PVI route exists and can read activity-event metrics from Supabase when the environment and table are ready.
- When Supabase config, table availability, or read access is missing, `/pvi` now degrades to an unavailable state instead of a generic load failure.

## Partial Or Configuration-Dependent Areas

- Detail MVP 2.0 remains partially implemented and split between modal and favorites page.
- Detail is structurally aligned in two current surfaces, but the broader detail roadmap still has open subtasks and later auth-linked phases.
- Auth base is implemented in `main`, but real operation still depends on external Supabase and Google OAuth configuration.
- Profile is a minimal auth-facing surface, not a complete persisted app profile.
- Favorites work today, but remain browser-local rather than user-linked.
- PVI exists, but depends on `activity_events` plus valid Supabase configuration and is still a partial internal surface.
- PVI no longer hard-fails the route for expected dependency gaps, but it still depends on external Supabase readiness to show real data.
- PVI has no browser-local fallback source; in the current environment the observed blocker is `PGRST205` because `public.activity_events` is missing from Supabase schema cache.
- Catalog data still comes from local fallback files, not from a real backend catalog.

## Difference Between Present State, MVP 2.0 Direction, And Beta Direction

### Present state in `main`

- Frontend runtime is real.
- Public catalog is real.
- Fallback data is the current source of catalog truth.
- Base auth flow is integrated.
- Protected routes and protected actions are implemented.
- Several user/account/data phases are still unfinished.

### MVP 2.0 direction

- Keep the current public catalog usable while moving deeper actions behind identified access.
- Continue the auth/profile/favorites/detail line from base auth toward more complete user-linked behavior.
- Replace frontend-only seams with clearer data and contract boundaries.
- Reduce reliance on temporary aliases and local-only persistence.

### Later beta direction

- Move catalog truth away from local fallback data and into a real backend flow.
- Add more complete profile and user data handling.
- Tighten access rules, analytics, and business logic beyond the current MVP baseline.

## Current State Summary

NensGo today is a real merged frontend baseline, not a blank prototype. It is also not a finished product. The repo already contains meaningful product structure, but several important lines remain partial: backend catalog, user-linked favorites, richer profile persistence, and the later auth/detail phases beyond the current base integration.
