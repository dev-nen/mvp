# Architecture

## Documentation Scope Note

This documentation reflects the current checked-out working state of `main`.
Baseline rechecked on April 23, 2026 after consolidating
`feat/real-db-auth-migration` and `feat/internal-draft-inbox` into `main`.
This file documents the architecture currently implemented in `main`, not the
ideal future architecture.

## Stack And Runtime Boundary

- Frontend app: React 18 + Vite
- Routing: `react-router-dom`
- Styling: plain CSS by feature/component file
- Browser data/auth client: `@supabase/supabase-js`
- Private internal metrics path: Vercel serverless function under `api/`

`main` now uses a mixed runtime:

- public app logic in the browser
- product data and auth in Supabase
- internal metrics reads through a private server-side Vercel path

## Current Route And Surface Map

| Route | Current role | Notes |
| --- | --- | --- |
| `/` | Landing + public catalog | Public route. Reads catalog from Supabase and opens detail through protected intent handling. |
| `/para-centros` | B2B landing for centers | Public route. Independent acquisition surface. |
| `/favoritos` | Favorites list | Protected route. Reads favorites from `user_favorite_activities`. |
| `/favoritos/:activityId` | Favorites detail page | Protected route. Routed detail surface. |
| `/perfil` | App profile surface | Protected route. Reflects auth state plus `user_profiles` readiness. |
| `/internal/drafts` | Internal Draft Inbox list | Internal-tool route. Requires authenticated app-user readiness plus `internal_tool_access`. |
| `/internal/drafts/:draftId` | Internal Draft Inbox detail | Internal-tool route. Uses the same guard and works against `activity_drafts`. |
| `/internal/activities/:activityId` | Internal approved activity page | Internal-tool route. Manages one approved activity linked from Draft Inbox. |
| `/soporte` | Placeholder surface | Not implemented as a real support workflow yet. |
| `/api/internal/pvi` | Private metrics API | Server-side reporting path for PO and DEV only. |

## Current Frontend Composition

### App shell and routing

- `src/App.jsx` defines the route map.
- `AuthProvider` wraps the full route tree.
- `ProtectedRoute` guards `/perfil`, `/favoritos`, and `/favoritos/:activityId`.
- `InternalToolRoute` guards `/internal/drafts` and `/internal/drafts/:draftId`
  without pushing internal-permission reads into `AuthContext`.

### Public Home and catalog

- `src/pages/HomePage.jsx` is the landing plus public catalog surface.
- `useCatalog()` loads activities through `catalogService`.
- `CatalogActivityCard` renders the public teaser grid.
- `ActivityDetailModal` is the Home detail surface and now resolves contact via
  `activity_contact_options`.

### Favorites

- `src/pages/FavoritesPage.jsx` lists user-linked remote favorites.
- `src/pages/FavoriteActivityDetailPage.jsx` is the routed favorites detail
  surface.
- `useFavorites()` is now backed by Supabase instead of `localStorage`.

### Auth and app user

- `src/context/AuthContext.jsx` owns session bootstrap, access-state resolution,
  pending protected intents, and onboarding completion.
- `ProtectedAccessGate` supports:
  - Google sign-in
  - email/password sign-in
  - email/password sign-up
  - verification messaging
  - onboarding-required completion
- `src/services/appUsersService.js` reads `public.user_profiles` and calls the
  profile-provisioning RPC.

### Internal metrics seam

- `api/internal/pvi.js` is the intended read path for internal reporting.
- `main` no longer exposes a public `/pvi` route.

### Internal Draft Inbox

- `src/pages/InternalDraftInboxPage.jsx` lists visible drafts for the internal
  team.
- `src/pages/InternalDraftDetailPage.jsx` owns review, reject, and approve
  actions.
- `src/pages/InternalApprovedActivityPage.jsx` owns edit, unpublish, and
  republish for already approved activities.
- `src/services/internalToolAccessService.js` checks whether the ready app user
  has access to `draft_inbox`.
- `src/services/internalDraftsService.js` reads and updates `activity_drafts`
  plus reference data for centers, categories, and types.
- `src/services/draftApprovalService.js` executes
  `approve_activity_draft(...)`.
- `src/services/internalApprovedActivitiesService.js` reads managed approved
  activities and executes the lifecycle RPCs for edit/unpublish/republish.

## Current Catalog Data Flow

The catalog path is now Supabase-backed:

1. Supabase exposes `public.catalog_activities_read`
2. `src/services/catalogService.js` reads that view
3. `catalogService` still derives UI-facing aliases such as `city_slug`
4. `src/hooks/useCatalog.js` exposes `activities`, `isLoading`, `error`, and
   `reload`
5. Home and Favorites consume that hook

There is no active runtime path from `src/data/catalogFallback.js` in `main`.

## Current Detail And Contact Flow

The detail experience is still split across two surfaces:

- Home modal in `ActivityDetailModal`
- Favorites routed page in `FavoriteActivityDetailPage`

Both surfaces use the shared detail view model and lazy-load
`activity_contact_options` for the selected activity only.

Contact rules in `main`:

- no fallback to center-level contact
- no hardcoded WhatsApp number
- one active option opens directly
- multiple active options open a chooser dialog
- zero options means no operational CTA

## Current Auth And Access Flow

The auth line in `main` is no longer Google-only metadata gating.

Current flow:

1. `src/services/supabaseClient.js` creates the browser client from:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. `AuthContext` bootstraps the Supabase session
3. `AuthContext` listens to `onAuthStateChange()`
4. Access state is resolved from:
   - anonymous session state
   - email verification state
   - `public.user_profiles` readiness
5. `ProtectedAccessGate` blocks normal flows until the user is both verified and
   provisioned enough for app use
6. Onboarding completion uses the Supabase RPC instead of direct frontend
   inserts into `public.user_profiles`
7. Internal Draft Inbox routes then layer a second check on top:
   - `internal_tool_access`
   - without storing internal-permission truth in `AuthContext`

Current access-state model:

- `anonymous`
- `loading_user`
- `verification_pending`
- `onboarding_required`
- `ready`
- `error`

## Current Role Of Supabase

Supabase now owns the product-side browser data contracts for `main`:

- Auth session bootstrap and session changes
- Google sign-in
- Email/password sign-in and sign-up
- App-profile reads from `public.user_profiles`
- Profile provisioning through `ensure_my_profile(...)`
- Public catalog read model
- Per-activity contact options
- Remote favorites persistence
- Internal editorial drafts through `activity_drafts`
- Internal reviewer permission truth through `internal_tool_access`
- Transacted draft approval through `approve_activity_draft(...)`
- Internal approved-activity lifecycle through dedicated phase 2 RPCs
- Write-side analytics for views and contact clicks

Supabase is no longer limited to auth plus a partial analytics table in
`main`.

## Current Role Of Vercel

Vercel is currently used for:

- building and serving the public frontend
- exposing the private `api/internal/pvi` read path
- keeping `SUPABASE_SERVICE_ROLE_KEY` and `INTERNAL_PVI_API_TOKEN` on the
  server side

Vercel is not the product backend for catalog/auth/favorites. It only hosts the
private reporting seam in this phase.

## Current Persistence Layers

- Favorites: Supabase `user_favorite_activities`
- Internal Draft Inbox: Supabase `activity_drafts` and `internal_tool_access`
- Pending protected intent: `sessionStorage`
- Auth session: Supabase-managed browser session persistence
- Internal metrics read path: server-side API only

`main` now mixes remote product persistence with minimal browser-side UI state,
but not with local catalog or local favorites truth.

## Current Contract Boundaries And Seams

- `catalog_activities_read` is the read contract the frontend depends on
- `activity_contact_options` is the only contact source
- `user_profiles` is the app-user truth
- `activity_drafts` is the internal editorial source of truth for Draft Inbox
- `internal_tool_access` is the internal permission seam for Draft Inbox
- `approve_activity_draft(...)` is the only safe publish path from draft to
  `activities` in this phase
- `get_internal_approved_activity(...)` is the internal read seam for approved
  activities managed by Draft Inbox
- `update_approved_activity_from_draft(...)`,
  `unpublish_approved_activity(...)`, and `republish_approved_activity(...)`
  are the only safe lifecycle writes for approved activities in this phase
- `auth.users` remains the identity authority for email
- `user_profiles.email` is treated as a synchronized read-side copy, not a
  user-editable field
- `/api/internal/pvi` is the intended internal reporting boundary

Important current seams still visible:

- `city_slug` is still derived in frontend for UI/routing purposes
- detail remains split across modal and routed page
- runtime readiness still depends on external Supabase and Vercel configuration

## Architectural Summary

The current `main` architecture is a mixed Supabase + Vercel product runtime:
catalog, auth, profile, favorites, analytics writes, and first-pass internal
editorial moderation now live on Supabase contracts, while private analytics
reads are pushed behind a server-side Vercel API. The code is aligned to that
architecture, but external readiness and final validation are still pending.
