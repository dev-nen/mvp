# Supabase Schema Preview (2026-04-20)

## Scope Note

This document captures the external Supabase schema preview shared by the user
on April 20, 2026 for planning work against the current checked-out `main`
branch.

This is not the active runtime contract inside the repo yet.
It is an external-system snapshot used to avoid planning blindly.

## Source Inputs

- Source 1: column inventory from `information_schema.columns`
- Source 2: foreign-key inventory from `information_schema.table_constraints`
- Source 3: RLS policy inventory from `pg_policies`
- Source 4: table-level `rowsecurity` status from `pg_tables`
- Source 5: grants for `anon` and `authenticated` from
  `information_schema.role_table_grants`

Security visibility is now materially better than in the first planning pass:

- all shared `public` tables were confirmed with `rowsecurity = true`
- policy and grant visibility now exists for the currently shared tables

## Table Inventory

### Catalog and discovery domain

- `activities`
- `activity_contact_options`
- `categories`
- `centers`
- `cities`
- `institutions`
- `type_activity`

### User domain

- `user_profiles`
- `user_role`
- `user_favorite_activities`

### Interaction and analytics domain

- `activity_view_events`
- `activity_contact_events`

## Relationship Inventory

- `activities.category_id -> categories.id`
- `activities.center_id -> centers.id`
- `activities.type_id -> type_activity.id`
- `activity_contact_events.activity_id -> activities.id`
- `activity_contact_events.city_snapshot_id -> cities.id`
- `activity_contact_events.user_profile_id -> user_profiles.id`
- `activity_contact_options.activity_id -> activities.id`
- `activity_view_events.activity_id -> activities.id`
- `activity_view_events.city_snapshot_id -> cities.id`
- `activity_view_events.user_profile_id -> user_profiles.id`
- `centers.city_id -> cities.id`
- `centers.institution_id -> institutions.id`
- `user_favorite_activities.activity_id -> activities.id`
- `user_favorite_activities.user_profile_id -> user_profiles.id`
- `user_profiles.city_id -> cities.id`
- `user_profiles.role_id -> user_role.id`

## Security Posture Snapshot

### Table-level RLS status

All shared `public` tables were reported with:

- `rowsecurity = true`
- `hasrules = false`
- `hastriggers = true`

This means client access is constrained by the combination of:

- grants
- RLS policies
- any trigger behavior not yet inspected

### Public catalog reads available to `anon` and `authenticated`

- `activities`: `SELECT` where `is_active = true` and `is_deleted = false`
- `categories`: `SELECT` with `true`
- `centers`: `SELECT` where `is_active = true` and `is_deleted = false`
- `cities`: `SELECT` with `true`
- `institutions`: `SELECT` where `is_active = true` and `is_deleted = false`
- `type_activity`: `SELECT` with `true`
- `activity_contact_options`: `SELECT` where `is_active = true` and
  `is_deleted = false`

### Public interaction writes available to `anon` and `authenticated`

- `activity_view_events`: `INSERT`
  - `with_check`: `user_profile_id IS NULL OR user_profile_id = auth.uid()`
- `activity_contact_events`: `INSERT`
  - `with_check`: `user_profile_id IS NULL OR user_profile_id = auth.uid()`

No `SELECT` policy was shared for either interaction table.

### Authenticated user-scoped access

- `user_favorite_activities`
  - `SELECT` own rows where `auth.uid() = user_profile_id` and
    `is_deleted = false`
  - `INSERT` own rows where `auth.uid() = user_profile_id` and
    `is_deleted = false`
  - `DELETE` own rows where `auth.uid() = user_profile_id`
- `user_profiles`
  - `SELECT` own row where `auth.uid() = id` and `is_deleted = false`
  - `UPDATE` own row where `auth.uid() = id` and `is_deleted = false`
- `user_role`
  - `SELECT` for authenticated users where `is_active = true`

### Notably absent from the shared security snapshot

- no `INSERT` policy or grant for `user_profiles`
- no `SELECT` policy or grant for `activity_view_events`
- no `SELECT` policy or grant for `activity_contact_events`
- no `UPDATE` policy or grant for `user_favorite_activities`

## Table Contracts

### `activities`

- `id`: `bigint`, required, default not provided
- `title`: `character varying`, required, default not provided
- `center_id`: `bigint`, required, default not provided
- `venue_name`: `character varying`, optional, default not provided
- `venue_address_1`: `character varying`, optional, default not provided
- `venue_postal_code`: `character varying`, optional, default not provided
- `category_id`: `bigint`, required, default not provided
- `type_id`: `bigint`, required, default not provided
- `description`: `character varying`, required, default not provided
- `image_url`: `character varying`, required, default not provided
- `age_rule_type`: `character varying`, required, default not provided
- `age_min`: `integer`, optional, default not provided
- `age_max`: `integer`, optional, default not provided
- `price_label`: `character varying`, optional, default not provided
- `is_free`: `boolean`, required, default `false`
- `schedule_label`: `character varying`, required, default not provided
- `is_featured`: `boolean`, required, default `false`
- `is_active`: `boolean`, required, default `true`
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `activity_contact_events`

- `id`: `bigint`, required, default not provided
- `activity_id`: `bigint`, required, default not provided
- `user_profile_id`: `uuid`, optional, default not provided
- `city_snapshot_id`: `bigint`, required, default not provided
- `contact_method`: `character varying`, required, default not provided
- `contact_target_snapshot`: `character varying`, required, default not provided
- `source`: `character varying`, required, default not provided
- `clicked_at`: `timestamp with time zone`, required, default `now()`

### `activity_contact_options`

- `id`: `bigint`, required, default not provided
- `activity_id`: `bigint`, required, default not provided
- `contact_method`: `character varying`, required, default not provided
- `contact_value`: `character varying`, required, default not provided
- `is_active`: `boolean`, required, default `true`
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `activity_view_events`

- `id`: `bigint`, required, default not provided
- `activity_id`: `bigint`, required, default not provided
- `user_profile_id`: `uuid`, optional, default not provided
- `city_snapshot_id`: `bigint`, required, default not provided
- `source`: `character varying`, optional, default not provided
- `viewed_at`: `timestamp with time zone`, required, default `now()`

### `categories`

- `id`: `bigint`, required, default not provided
- `name`: `character varying`, required, default not provided

### `centers`

- `id`: `bigint`, required, default not provided
- `institution_id`: `bigint`, required, default not provided
- `name`: `character varying`, required, default not provided
- `city_id`: `bigint`, required, default not provided
- `address_line_1`: `character varying`, required, default not provided
- `postal_code`: `character varying`, required, default not provided
- `latitude`: `numeric`, optional, default not provided
- `longitude`: `numeric`, optional, default not provided
- `contact_phone`: `character varying`, optional, default not provided
- `contact_email`: `character varying`, optional, default not provided
- `is_active`: `boolean`, required, default `true`
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `cities`

- `id`: `bigint`, required, default not provided
- `name`: `character varying`, required, default not provided

### `institutions`

- `id`: `bigint`, required, default not provided
- `name`: `character varying`, required, default not provided
- `is_active`: `boolean`, required, default `true`
- `website_url`: `character varying`, optional, default not provided
- `description`: `character varying`, optional, default not provided
- `logo_url`: `character varying`, optional, default not provided
- `contact_email`: `character varying`, optional, default not provided
- `legal_name`: `character varying`, optional, default not provided
- `contact_phone`: `character varying`, optional, default not provided
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `type_activity`

- `id`: `bigint`, required, default not provided
- `name`: `character varying`, required, default not provided

### `user_favorite_activities`

- `id`: `bigint`, required, default not provided
- `user_profile_id`: `uuid`, required, default not provided
- `activity_id`: `bigint`, required, default not provided
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `user_profiles`

- `id`: `uuid`, required, default not provided
- `name`: `character varying`, required, default not provided
- `last_name`: `character varying`, optional, default not provided
- `email`: `character varying`, required, default not provided
- `picture_url`: `character varying`, optional, default not provided
- `city_id`: `bigint`, required, default not provided
- `role_id`: `bigint`, required, default not provided
- `is_active`: `boolean`, required, default `true`
- `created_at`: `timestamp with time zone`, required, default `now()`
- `created_by`: `character varying`, required, default `'system'`
- `updated_at`: `timestamp with time zone`, required, default `now()`
- `updated_by`: `character varying`, required, default `'system'`
- `deleted_at`: `timestamp with time zone`, optional, default not provided
- `deleted_by`: `character varying`, optional, default not provided
- `is_deleted`: `boolean`, required, default `false`

### `user_role`

- `id`: `bigint`, required, default not provided
- `role`: `character varying`, required, default not provided
- `is_active`: `boolean`, required, default `true`

## Planning Notes Against Current `main`

The schema preview is already enough to identify several planning-relevant facts
before any implementation starts:

- The catalog domain exists in Supabase as normalized tables, not as the
  frontend-local fallback shape.
- The user domain exists in Supabase with `user_profiles` and
  `user_favorite_activities`.
- Interaction storage is split across `activity_view_events` and
  `activity_contact_events`.
- The current repo's expected `activity_events` table is not present in the
  shared snapshot.
- Per-activity contact data appears to be modeled through
  `activity_contact_options`.
- City slugs were not present in the shared `cities` table output.
- A short teaser field such as `short_description` was not present in the
  shared `activities` output.

## Security Reading Against Current `main`

- Direct browser reads for the catalog domain look viable under the current
  `anon` and `authenticated` policies.
- Direct browser reads for per-activity contact options also look viable.
- Direct browser writes for view and contact events look viable for both
  anonymous and authenticated sessions.
- Direct browser reads for analytics do not look viable under current policies,
  because no event-table `SELECT` policy was shared.
- Direct browser favorites persistence for authenticated users looks viable.
- Direct browser read/update of an existing own `user_profiles` row looks
  viable.
- Direct browser creation of a `user_profiles` row does not look viable from
  the shared policies and grants.

Practical reading:

- catalog migration is less blocked by security than previously assumed
- favorites migration is structurally compatible with client-side auth
- profile bootstrap is still unresolved
- PVI cannot assume direct browser reads against the current interaction-table
  policies

## Security-Specific Risks Visible From The Snapshot

- Public `SELECT` on base tables may expose more columns than the product wants
  to expose in a browser-facing contract, including audit fields.
- `activity_contact_options` is publicly readable, so any contact values stored
  there should be treated as intentionally public.
- `user_favorite_activities` includes soft-delete fields, but the shared
  policies expose `DELETE` rather than an authenticated `UPDATE` path for
  marking rows deleted.
- `user_profiles` requires a provisioning strategy outside the currently shared
  client-access rules.

## Unknowns Still Pending

- Whether `user_profiles.id` is intended to equal `auth.users.id`
- Whether the `bigint` primary keys are identity-backed even though
  `column_default` was not shown
- Whether additional views, RPC functions, or non-`public` schema objects exist
- Whether the production app should read the normalized tables directly or
  through a read model such as a view
- Whether `user_profiles` is created by trigger, backend job, Edge Function, or
  an admin-only path
- Whether `user_favorite_activities` hard-deletes rows or uses a trigger to
  convert delete actions into soft deletes
- Whether the current public-read policies are intended to expose raw base
  tables or are only temporary until a narrower read model exists
