# Real DB And Auth Migration SDD

## Scope Note

This document is a spec-first planning artifact for the current checked-out
`main` branch as reviewed on April 20, 2026.

It does not implement the migration.
It prepares the repo to discuss and review the move from local fallback data to
real Supabase-backed data without planning blindly.

## Branch Context

- Active branch for this planning pass: `main`
- `main` is the implementation baseline for this document, not a historical
  comparison target
- Current repo code and current master docs remain the source of truth for what
  the app does today
- The external Supabase schema preview is planning input, not proof that the
  frontend already uses that model

## Input Sources

- Master docs:
  - `docs/PROJECT_STATE.md`
  - `docs/ARCHITECTURE.md`
  - `docs/FEATURE_STATUS.md`
  - `docs/TECH_DEBT.md`
  - `docs/ROADMAP_IMPLEMENTATION.md`
- Feature docs:
  - `docs/auth-base-mvp2.md`
  - `docs/catalog-fallback-public-contract-audit.md`
  - `docs/card-public-v2-data-mapping.md`
  - `docs/detail-view-mvp2-data-mapping.md`
  - `docs/pvi-supabase-readiness-note.md`
- External schema snapshot documented in
  [`supabase-schema-preview-2026-04-20.md`](./supabase-schema-preview-2026-04-20.md)

## What Is True Today In `main`

- The public catalog still reads from `src/data/catalogFallback.js` through
  `src/services/catalogService.js`.
- The runtime enriches local fallback data with frontend aliases such as
  `center_name`, `city_name`, and `city_slug`.
- Favorites still live in browser `localStorage` through `src/hooks/useFavorites.js`.
- Base auth exists through Supabase Auth, but the current user-facing entry path
  is Google-only.
- The current auth flow stores required city data in auth user metadata rather
  than in a dedicated app-profile table.
- The profile route reflects auth state, not a fuller persisted profile model.
- The contact CTA still uses a fixed WhatsApp base number through
  `src/helpers/buildWhatsappActivityMessage.js`.
- PVI currently expects a single `activity_events` table and remains blocked
  when that source is unavailable.

## Goal

Prepare the project for a controlled migration from frontend-local fallback
truth to real Supabase-backed product data, while expanding auth from
Google-only access to a dual-entry model:

- social login with Google
- classic sign-up flow

Success for the later implementation phase would mean:

- catalog truth comes from the real database
- favorites become user-linked instead of browser-local
- the app-user layer is backed by `user_profiles` instead of auth metadata only
- auth entry supports Google plus classic account creation
- the interaction model is aligned with the real schema instead of the current
  placeholder assumptions
- local mocks stop being the primary source of truth for production behavior

## Out Of Scope For This Documentation Phase

- No code changes
- No schema migrations
- No RLS policy design or implementation
- No final decision on email verification, password-reset UX, or account-linking
  policy
- No admin/backoffice design
- No commitment yet on whether Supabase tables will be consumed directly or
  through SQL views/RPCs

## Confirmed Fit Between Current App Direction And The Shared Schema

- `activities.id` uses `bigint`, which aligns with the current frontend's
  requirement that tracked activity ids be numeric.
- `activities.is_free` exists in the shared schema, which matches the UI's
  existing free-badge behavior.
- The catalog domain already has public-read grants and RLS policies for
  `anon` and `authenticated`.
- The database already contains normalized catalog entities:
  `activities`, `centers`, `cities`, `categories`, `institutions`,
  `type_activity`.
- The database already contains a user-profile table and a favorites table:
  `user_profiles`, `user_favorite_activities`.
- Favorites already have authenticated own-row `SELECT`, `INSERT`, and `DELETE`
  policies.
- Existing own-profile reads and updates already have authenticated policies.
- The database already contains interaction tables that suggest a real backend
  analytics path:
  `activity_view_events`, `activity_contact_events`.
- Anonymous and authenticated event inserts are already allowed for those two
  interaction tables, with `user_profile_id` constrained to `NULL` or
  `auth.uid()`.
- The database already contains per-activity contact options through
  `activity_contact_options`.

## Confirmed Gaps And Mismatches Against Current `main`

### Catalog read model mismatch

The current frontend reads a denormalized runtime shape that does not exist as
such in the shared snapshot:

- current runtime uses `category_label`
- current runtime uses `center_name`
- current runtime uses `city_name`
- current runtime uses `city_slug`
- current runtime uses `short_description`

The shared schema instead exposes:

- `activities.category_id`
- `activities.center_id`
- `centers.city_id`
- `categories.name`
- `centers.name`
- `cities.name`
- `activities.description`

Immediate implication:

- the repo cannot switch from fallback to DB reads by only swapping the data
  source
- a read contract or mapping layer must be defined first

### City slug mismatch

The current catalog filter and city-choice flow depend on `city_slug`.
The shared `cities` snapshot only confirms:

- `id`
- `name`

Nothing shared so far proves that a slug exists.

Immediate implication:

- either the schema needs a stable slug field
- or the frontend must stop treating slug as persisted truth and derive another
  filtering contract

### Detail copy mismatch

The current detail view model prefers `activity.short_description`.
The shared `activities` snapshot only confirms `description`.

Immediate implication:

- the app needs either a new teaser/summary field in the backend contract
- or a documented rule to reuse/truncate `description`

### Contact flow mismatch

Today the app opens a fixed WhatsApp number.
The shared schema suggests contact should be data-driven:

- center-level contact data exists in `centers`
- activity-level contact data exists in `activity_contact_options`

Immediate implication:

- contact CTA behavior should be redesigned against the real backend contract
  before migration
- the current fixed-number helper should not be assumed to survive the move

### Favorites model mismatch

Today favorites are local-only.
The shared schema includes `user_favorite_activities`.

Immediate implication:

- favorites can move to user-linked persistence
- migration rules are needed for first-login behavior if local favorites should
  be imported
- delete semantics still need confirmation because the table has soft-delete
  columns, but the shared access model exposes `DELETE`, not `UPDATE`

### User model mismatch

Today minimal user state is derived from auth metadata and city completion is
  saved through `supabase.auth.updateUser()`.

The shared schema expects a real app profile:

- `user_profiles.id`
- `user_profiles.email`
- `user_profiles.city_id`
- `user_profiles.role_id`

Immediate implication:

- the later implementation needs a profile provisioning strategy
- city should stop being treated as metadata-only truth
- `role_id` is required, so role assignment rules must be defined before user
  creation is implemented
- because no `INSERT` policy or grant was shared for `user_profiles`, client
  signup alone is not enough; some bootstrap mechanism must already exist or be
  designed first

### Analytics mismatch

Today the frontend expects one table:

- `activity_events`

The shared schema instead provides:

- `activity_view_events`
- `activity_contact_events`

The current frontend also tracks favorite add and favorite remove as events.
No matching favorite-event table was confirmed in the shared snapshot.
The shared security model also exposes `INSERT` on the event tables, but not
`SELECT`.

Immediate implication:

- PVI cannot be migrated by renaming an endpoint only
- the analytics contract needs an explicit redesign
- favorite interactions need a product decision: persist only favorite state, or
  also persist favorite events
- with current policies, browser-side event logging is plausible but browser-side
  dashboard reads are not

### Auth expansion mismatch

Today the implemented auth surface is Google-only.
The requested objective adds classic sign-up.

Immediate implication:

- auth scope expands from one provider path to at least two entry paths
- the future design must define how Google accounts and classic accounts map to
  the same `user_profiles` model

## Constraints And Non-Negotiables

- Planning must stay grounded in the current `main` repo state until code
  actually changes.
- Current docs remain honest: the catalog is still local today, favorites are
  still local today, and auth entry is still Google-only today.
- No implementation should assume `user_profiles.id` mapping to `auth.users.id`
  until confirmed.
- No implementation should assume bigint primary keys auto-generate, because the
  shared query did not include `is_identity`.
- Soft-delete semantics in the shared schema must be treated as real data
  constraints and not ignored:
  `is_deleted`, `deleted_at`, `deleted_by`
- No implementation should assume client-side signup can create `user_profiles`,
  because the shared policies do not currently prove that path exists

## Recommended Direction For Review

### Catalog

Prefer a backend-facing read contract that returns the current UI needs in a
stable shape, instead of spreading multi-table joins and alias rules across
frontend components.

That could be achieved through either:

- a SQL view dedicated to catalog reads
- a server/RPC read contract
- or a clearly isolated frontend mapping layer as an interim step

Recommended bias:

- do not let every page rebuild joins independently
- centralize the read model once
- even though base-table public reads already exist, prefer a narrowed read
  contract if the product does not want raw audit columns exposed

### Auth

Keep Supabase Auth as the auth platform, but expand the entry contract to:

- Google social login
- classic sign-up

Recommended bias:

- a successful auth event should provision or reconcile a `user_profiles` row
- app identity should be anchored in `user_profiles`, not only in auth metadata
- the provisioning mechanism should be explicit before coding:
  trigger, Edge Function, server path, or another controlled bootstrap

### Favorites

Move favorites to `user_favorite_activities` as the durable source of truth.

Recommended bias:

- keep a temporary local-to-remote migration path for first authenticated use
- remove browser-local favorites as primary truth once remote persistence is
  proven
- decide whether delete in the product means hard delete or soft delete before
  wiring the client

### Analytics

Do not force the existing placeholder `activity_events` assumption into the real
schema without review.

Recommended bias:

- redesign the frontend analytics service against the real tables
- keep direct client inserts only if that matches the intended abuse/rate model
- use a protected read path, a narrowed admin read model, or new read policies
  if the product still wants a dashboard like `/pvi`
- explicitly introduce a compatibility read model if the product wants one
  aggregated source

## Proposed Implementation Sequence

1. Confirm missing backend facts before coding.
   - confirm whether `user_profiles.id = auth.users.id`
   - confirm how `user_profiles` rows are created today
   - confirm whether classic sign-up should require email verification
   - confirm whether favorites need first-login migration from local storage
   - confirm whether `cities` should expose a stored slug
   - confirm whether favorites are meant to hard-delete or soft-delete
2. Define the real read contract for catalog and city choices.
   - map normalized DB tables to the runtime fields the UI actually needs
   - decide whether `short_description` is a backend field or a derived field
   - decide whether contact data comes from center-level or activity-level truth
   - decide whether the app reads public base tables directly or through a
     narrowed view/read model
3. Define the app-user contract.
   - decide profile bootstrap rules
   - decide role assignment defaults for classic and Google sign-up
   - decide which user fields remain in auth metadata versus `user_profiles`
4. Expand auth design.
   - keep Google social login
   - add classic sign-up
   - define account reconciliation rules when the same email appears in both
     paths
5. Move favorites to real persistence.
   - read favorites from `user_favorite_activities`
   - write favorites there
   - decide whether local favorites are imported, ignored, or merged once
6. Redesign analytics and PVI against the real schema.
   - map view events
   - map contact events
   - decide what happens to favorite add/remove analytics
   - decide whether dashboard reads happen through privileged backend access,
     a protected view, or new read policies
7. Retire mocks only after the real paths are validated.
   - catalog fallback stops being primary truth
   - local favorites stop being primary truth
   - placeholder analytics assumptions stop being primary truth

## Expected Future Implementation Surface

The later implementation will likely touch at least these areas:

- `src/services/catalogService.js`
- `src/hooks/useCatalog.js`
- `src/services/catalogCityChoicesService.js`
- `src/context/AuthContext.jsx`
- `src/services/appUsersService.js`
- `src/hooks/useFavorites.js`
- `src/services/activityEventsService.js`
- `src/hooks/useActivityEventsDashboard.js`
- `src/helpers/activityEventsAnalytics.js`
- `src/helpers/buildWhatsappActivityMessage.js`
- `src/components/auth/ProtectedAccessGate.jsx`
- `src/pages/ProfilePage.jsx`
- new Supabase-backed read/write services and possibly new contract-normalization
  helpers

## Risks

- The current frontend shape and the real schema are materially different.
- User provisioning may fail if `role_id` and `city_id` are mandatory with no
  default strategy.
- User provisioning may also fail because no client `INSERT` path for
  `user_profiles` is currently visible in the shared policies.
- Email/password and Google may produce account-merge edge cases.
- City slugs may break the current filter contract if they do not exist in the
  backend.
- Contact CTA behavior may regress if the current fixed WhatsApp shortcut is
  replaced without a normalized contact contract.
- PVI may stay partial until analytics scope is deliberately redesigned and a
  real read path is defined.
- Public base-table reads may expose more raw columns than the final browser
  contract should expose.

## Assumptions Avoided

- We are not assuming the shared DB schema is already wired to the deployed app.
- We are not assuming the shared schema contains every field the current UI uses.
- We are not assuming classic sign-up is already enabled in Supabase Auth.
- We are not assuming `user_profiles` rows are created automatically today.
- We are not assuming favorite-event analytics already exist in the backend.
- We are not assuming ids auto-increment just because they are `bigint`.
- We are not assuming `/pvi` can stay as a direct browser read on top of current
  event-table policies.

## Validation For The Later Implementation Phase

The later implementation should not be considered closed until all of the
following are explicitly checked:

- catalog loads from real DB data in the deployed environment
- current filters and city-choice flows still work with the new contract
- detail surfaces still render valid content
- Google login works end-to-end
- classic sign-up works end-to-end
- user profile provisioning works end-to-end
- favorites persist per authenticated user
- contact CTA uses the intended real backend contact source
- analytics writes and reads align with the real tables
- `/pvi` is reviewed again only after its real source is proven

## Pending Inputs Before Coding

- confirmation of the auth-to-profile identity rule
- confirmation of the current `user_profiles` provisioning mechanism
- confirmation of the default user role for family accounts
- confirmation of email verification policy for classic sign-up
- confirmation of whether city slug is a required backend field
- confirmation of whether favorites are intended to hard-delete or soft-delete
- confirmation of whether a protected analytics read path already exists outside
  the shared `public` tables
- optional sample rows for `activities`, `centers`, `cities`,
  `activity_contact_options`, and `user_profiles`

## Closure Reading For This Documentation Pass

- Current app behavior: unchanged
- External schema visibility: improved
- Security and RLS visibility: improved
- Migration objective: documented
- Implementation readiness: partial, pending provisioning, read-model, and
  auth-profile confirmation
