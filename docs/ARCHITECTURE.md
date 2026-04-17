# Architecture

## Documentation Scope Note

This documentation reflects the current merged state of `main` at the time of writing.
Baseline checked on April 17, 2026 against `main` at HEAD `bff3c62`.
This file documents the architecture currently running in the repo, not the ideal future architecture.

## Stack And Runtime Boundary

- Frontend app: React 18 + Vite
- Routing: `react-router-dom`
- Styling: plain CSS modules by feature/component file
- External service client: `@supabase/supabase-js`
- No current backend catalog integration inside the repo

The current app is a single frontend runtime with prepared seams for future evolution. Some pieces are already integrated, but they are not all fully closed as end-state product systems.

## Current Route And Surface Map

| Route | Current role | Notes |
| --- | --- | --- |
| `/` | Landing + public catalog | Public route. Shows teaser catalog cards and opens detail through the current protected-action flow. |
| `/favoritos` | Favorites list | Protected route. Reads current favorites from local browser state. |
| `/favoritos/:activityId` | Favorites detail page | Protected route. Current routed detail surface. |
| `/perfil` | Minimal profile/auth surface | Protected route. Reflects current auth and session state. |
| `/pvi` | Interaction dashboard | Public route today, although product copy treats it as internal. |
| `/soporte` | Placeholder surface | Not implemented as a real support workflow yet. |

## Current Frontend Composition

### App shell and routing

- `src/App.jsx` defines the route map.
- `AuthProvider` wraps the full route tree.
- `ProtectedRoute` guards `/perfil`, `/favoritos`, and `/favoritos/:activityId`.

### Public Home and catalog

- `src/pages/HomePage.jsx` is the current landing plus public catalog surface.
- `useCatalog()` loads activities through `catalogService`.
- `CatalogActivityCard` has a public teaser variant used by Home.
- `ActivityDetailModal` is the current Home detail surface, triggered through the protected-action flow.

### Favorites

- `src/pages/FavoritesPage.jsx` lists locally stored favorites.
- `src/pages/FavoriteActivityDetailPage.jsx` is the current routed detail page for favorites.
- `useFavorites()` is the source of truth for favorite ids in the browser.

### Auth and profile

- `src/context/AuthContext.jsx` owns current auth state, session bootstrap, pending intents, and access gating.
- `ProtectedAccessGate` handles sign-in prompts and required city completion.
- `src/pages/ProfilePage.jsx` renders the current minimal account surface.

### PVI

- `src/pages/PviPage.jsx` reads dashboard data through `useActivityEventsDashboard()`.
- PVI depends on `activity_events` data coming from Supabase.

## Current Catalog Data Flow

The catalog path is currently frontend-local:

1. `src/data/catalogFallback.js` stores raw `activities`, `centers`, and `cities`.
2. `src/services/catalogService.js` filters active activities and enriches them with runtime aliases:
   - `center_name`
   - `city_name`
   - `city_slug`
3. `src/hooks/useCatalog.js` exposes `activities`, `isLoading`, `error`, and `reload`.
4. Home, Favorites, and city-choice flows consume that hook or services built on top of it.

This is the current source of truth for the catalog in `main`. There is no real backend catalog fetch in the current architecture.

## Current Detail Flow

The detail experience is partially implemented in two surfaces:

- Home uses the gated modal surface in `ActivityDetailModal`
- Favorites uses the routed page in `FavoriteActivityDetailPage`

Both surfaces now consume the shared detail view model in `src/helpers/activityDetailViewModel.js`, which centralizes:

- image fallback
- title/category/free-badge visibility
- evaluation items
- location items

This reduces divergence, but it does not mean the broader detail roadmap is complete. The runtime still keeps two surfaces and later detail/auth phases remain open.

## Current Auth And Access Flow

The current auth line is base auth integrated in `main`, not the full auth roadmap.

Current flow:

1. `src/services/supabaseClient.js` creates the Supabase client from:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. `AuthContext` bootstraps the session with `supabase.auth.getSession()`
3. `AuthContext` listens to `onAuthStateChange()`
4. Sign-in uses `signInWithOAuth({ provider: "google" })`
5. Pending protected intents are stored in `sessionStorage`
6. Protected routes and protected actions are released only when the current access state is ready
7. If the user lacks required city metadata, `ProtectedAccessGate` asks for city completion before continuing

Current protected behaviors:

- `/perfil`
- `/favoritos`
- `/favoritos/:activityId`
- Home "view more" detail action

This flow is implemented in code, but real operation remains externally configuration-dependent on Supabase project settings, Google OAuth settings, redirect URLs, and provider enablement.

## Current Role Of Supabase

Supabase is currently used for specific roles, not as the full backend of the product:

- Auth session bootstrap and session changes
- Google sign-in through Supabase Auth
- User metadata update for required city
- Reading and writing `activity_events`
- Feeding the PVI dashboard when data exists

Supabase is not currently the live catalog backend in `main`.

## Current Persistence Layers

- Favorites: `localStorage`
- Activity-event session id: `localStorage`
- Pending protected intent: `sessionStorage`
- Auth session: Supabase-managed session persistence in the browser

This means the current runtime already mixes remote auth state with local browser persistence for favorites and analytics identity.

## Current Contract Boundaries And Seams

### Base fallback truth

`catalogFallback.js` is the current raw data baseline for catalog entities.

### Runtime-enriched frontend shape

`catalogService` adds aliases such as `center_name`, `city_name`, and `city_slug` to support the current UI.

### Future backend truth

Feature-level docs already describe the intended distinction between current runtime aliases and backend-oriented source fields. That future backend truth is not yet the active architecture in `main`.

Important current seams:

- `category_label` is still the active visible taxonomy field in the frontend.
- `is_free` is not present in the normal fallback runtime shape, so free-state UI exists but usually stays hidden.
- City and center display values are frontend runtime aliases, not raw fallback truth.

## Architectural Summary

The current architecture is a real frontend application with routing, local catalog data, partial protected flows, and targeted Supabase integration. It already has seams prepared for a fuller backend-backed product, but those seams should not be mistaken for completed backend architecture.
