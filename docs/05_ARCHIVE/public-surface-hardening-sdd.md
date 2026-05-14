# Public Surface Hardening SDD

## Branch Context

- Active branch for this work: `main`
- `main` is the implementation source of truth for this SDD

## Current State

- Public surfaces in `main` no longer expose hard technical debug, but they
  still showed copy patterns that read as internal guidance, instrumentation, or
  over-labeled sectioning.
- The most visible examples were:
  - `Home` and catalog toolbar
  - public detail in Home modal and Favorites detail page
  - `Profile` and `Favorites`
  - `/soporte`
  - the preview modal inside `/para-centros`
  - the public `/pvi` placeholder route
- Internal routes under `/internal/*` intentionally keep internal copy and are
  not part of this hardening pass.

## Goal

- Remove debug-like, meta, or overly self-referential copy from public
  surfaces.
- Retire the public `/pvi` placeholder route from the frontend.
- Keep the public UI understandable without changing data contracts, auth
  behavior, contact logic, or overall layout.

## Touched Files

- `src/App.jsx`
- `src/pages/HomePage.jsx`
- `src/components/landing/LandingBridgeCTA.jsx`
- `src/components/filters/CatalogToolbar.jsx`
- `src/components/catalog/ActivityDetailModal.jsx`
- `src/pages/FavoritesPage.jsx`
- `src/pages/FavoriteActivityDetailPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/PlaceholderPage.jsx`
- `src/pages/ParaCentrosPage.jsx`
- `src/pages/PviPage.jsx`
- `src/pages/PviPage.css`
- Minimal CSS alignment in the matching feature/page stylesheets

## Out Of Scope

- `/internal/drafts`
- `/internal/drafts/:draftId`
- `/internal/activities/:activityId`
- auth logic, catalog logic, favorites persistence, tracking, or contact-option
  behavior
- broader editorial rewrite of `/para-centros`
- observability implementation or server-side logging work

## Copy Rules For This Pass

- No eyebrow/kicker copy in public UI when it only points at the section the
  user is already looking at.
- No instrumental counters in public headers when they read like operator
  metrics rather than user value.
- No public copy explaining internal diagnostics, reporting seams, or temporary
  implementation status.
- Keep real labels that describe user data or actionable facts.
- Favor short, direct titles and CTAs over stacked meta-heading structures.

## Implementation Sequence

1. Remove `/pvi` from the public route tree and keep internal reporting only at
   `api/internal/pvi`.
2. Simplify Home, Favorites, Profile, and Support copy by removing redundant
   eyebrows, counters, and system-facing wording.
3. Treat Home modal and Favorites detail as one public detail system and remove
   duplicated meta headings from both.
4. Apply the same public-detail criterion to the `/para-centros` preview modal
   only, without touching the page's marketing narrative.
5. Align master docs so they describe the post-hardening `main` state instead of
   the retired `/pvi` placeholder state.

## Validation

### Command Checks

- `npm.cmd run build`
- `git diff --check`

### Manual Checks

1. `/` no longer shows `CATALOGO ACTIVO`, `TU BUSQUEDA EMPIEZA AQUI`,
   `Exploracion`, or the `resultados | favoritos` counter.
2. Home empty/error states remain understandable without eyebrow labels.
3. Home modal detail no longer uses meta section headings like `Descripcion`,
   `Informacion clave`, `Ubicacion`, or `Accion principal`.
4. `/favoritos` and `/favoritos/:activityId` follow the same hardening pattern.
5. `/perfil` reads like product UI, not auth/debug UI.
6. `/soporte` shows a simple placeholder without redundant heading layers.
7. `/para-centros` keeps its marketing copy, but its preview modal matches the
   simplified public detail style.
8. `/pvi` no longer resolves as a public route and falls through to `/`.
