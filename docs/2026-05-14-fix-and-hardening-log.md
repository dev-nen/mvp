# Fix And Hardening Log - 2026-05-14

## Scope

This document records the municipality onboarding, i18n, legal-copy, tooling,
and security-hardening fixes landed after the recent defensive review.

Branch context at the time of documentation:

- Branch: `main`
- Relevant commits:
  - `9ee4fe5` `Restore municipality rollout and i18n resilience fixes`
  - `e047b34` `Harden internal RPC and public contact access`
- No live Supabase or Vercel validation was performed as part of the local fix
  pack.

## Why This Work Was Done

The review found two groups of risk:

- rollout and maintainability issues after municipality onboarding, i18n, and
  legal-page work
- security and privacy hardening issues around internal SQL helpers, public
  contact reads, profile city validation, and protected-intent browser storage

The fixes below were intentionally scoped to known review findings. They did
not add new product features, new routes, legal-copy changes, OAuth dashboard
changes, live Supabase mutations, or Vercel changes.

## Fix Pack 1 - Municipality, I18n, Legal Copy, And Tooling

### Municipality onboarding fallback

File:

- `src/services/municipalityService.js`

What changed:

- Municipality search still prefers `municipality_choices_read`.
- If the preferred source succeeds but returns `[]`, the service now continues
  to fallback sources instead of returning empty immediately.
- Non-recoverable query errors still throw; schema/cache rollout errors remain
  recoverable.
- Results remain deduplicated by city id plus the synthetic Les Roquetes key.

Risk closed:

- A frontend deploy could have shown no municipality choices if
  `municipality_choices_read` existed but had not been seeded yet.

### Les Roquetes / Roquetas rollout behavior

File:

- `src/services/municipalityService.js`

What changed:

- Les Roquetes / Roquetas remains a synthetic onboarding option.
- Selecting it still persists the official Sant Pere de Ribes `city_id`.
- The Sant Pere lookup no longer caches a successful `null` forever, so a seed
  rollout can recover on later searches without a page reload.

Risk closed:

- During seed rollout, an early empty lookup could have hidden the synthetic
  option until reload.

### I18n localStorage resilience

File:

- `src/i18n/I18nProvider.jsx`

What changed:

- `localStorage.getItem` and `localStorage.setItem` are guarded by safe helper
  functions.
- If reading persisted language fails, the app falls back to the default
  language.
- If writing persisted language fails, language switching still works in memory.
- No debug UI or production console spam was added.

Risk closed:

- Restricted browsers or privacy modes could throw `SecurityError` and crash the
  app during startup or language changes.

### Legal copy bundle split

Files:

- `src/i18n/I18nProvider.jsx`
- `src/pages/LegalPage.jsx`
- `src/i18n/legal/*`

What changed:

- Legal dictionaries moved out of the eager i18n provider path.
- Legal pages select Spanish, Catalan, or English copy through the lazy legal
  page route.
- `useI18n().language` remains the language source.
- Legal routes remain `/privacidad` and `/terminos`.

Risk reduced:

- Legal copy no longer has to be eagerly included by the i18n provider for core
  app UX.

### DIR3 generator reproducibility

File:

- `scripts/generate-dir3-municipalities.mjs`

What changed:

- The local absolute default input path was removed.
- The script now requires an explicit input CSV argument.
- Usage text documents the normalized DIR3 CSV columns and gives a repo-local
  example path such as `data/raw/dir3/municipios_es_dir3.csv`.
- The script does not require secrets and does not call live Supabase.

Risk closed:

- Regeneration no longer depends on one developer's Downloads folder.

### Legacy catalog city service removal

File removed:

- `src/services/catalogCityChoicesService.js`

What changed:

- The unused catalog-derived onboarding city service was deleted.
- Onboarding remains based on municipality/city sources, not catalog activity
  cities.

Risk closed:

- The code no longer preserves a dead path that could accidentally reintroduce
  catalog-derived onboarding.

## Fix Pack 2 - Defensive Security Hardening

### Internal seed helper privilege lockdown

SQL patch:

- `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`

What changed:

- `public.seed_activity_draft_examples(uuid)` now has explicit execution
  privilege controls:
  - `REVOKE ALL` from `PUBLIC`
  - `REVOKE ALL` from `anon`
  - `REVOKE ALL` from `authenticated`
  - `GRANT EXECUTE` only to `service_role`
- The helper search path is hardened with `public, pg_temp`.

Risk closed:

- A normal authenticated user should not be able to call the seed helper to
  grant themselves internal access through `internal_tool_access`.

### Other security-definer RPC privilege normalization

SQL patch:

- `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`

What changed:

- Related security-definer RPCs now have explicit revokes and minimal grants.
- Internal Draft Inbox and approved-activity lifecycle RPCs remain callable by
  `authenticated`, but still enforce `auth.uid()` and `internal_tool_access`.
- `get_internal_pvi_report()` remains `service_role` only.
- `ensure_my_profile(...)` remains callable by `authenticated`.
- Search paths were normalized to include `pg_temp` for hardened definitions or
  function settings.

Risk reduced:

- Function execution privileges are no longer left to PostgreSQL defaults for
  the reviewed internal/admin surfaces.

### Safe public contact read model

SQL patch:

- `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`

Frontend and tooling files:

- `src/services/activityContactOptionsService.js`
- `scripts/gate3-data-readiness.mjs`
- `scripts/gate4-smoke-prep.mjs`
- `scripts/runtime-preview-check.mjs`
- `supabase/manual/gate3d_public_catalog_contact_coverage.sql`

What changed:

- A public-safe view was added: `public.activity_contact_options_read`.
- The view exposes contact options only when:
  - the contact option is active
  - the contact option is not deleted
  - the parent activity is active
  - the parent activity is not deleted
  - the parent center is active
  - the parent center is not deleted
- Public frontend contact reads now use `activity_contact_options_read`.
- Public smoke/readiness scripts were moved to the same view.
- Public select on the raw `activity_contact_options` table is revoked from
  `PUBLIC`, `anon`, and `authenticated`.

Risk closed:

- A public client should not be able to read active contact details for
  unpublished, inactive, deleted, or otherwise non-catalog-visible activities by
  guessing an activity id.

### `ensure_my_profile` city validation

SQL patch:

- `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`

What changed:

- `ensure_my_profile(text, text, bigint)` no longer accepts any existing city
  id.
- The submitted `profile_city_id` must reference a row in `public.cities` with:
  - `is_active = true`
  - `place_type = 'municipality'`
  - `country_code = 'ES'`
  - `municipality_code is not null`
  - `dir3_code is not null`

Risk closed:

- A crafted client cannot provision a profile with inactive, test, legacy, or
  non-municipality city rows after this patch is applied.

### Protected-intent sessionStorage resilience

File:

- `src/context/AuthContext.jsx`

What changed:

- Protected-intent `sessionStorage` reads, writes, and removals are guarded by
  safe wrappers.
- If browser storage is unavailable, the app keeps working without crashing.
- No debug UI or production console spam was added.

Risk closed:

- Restricted browser modes should not crash protected-intent auth flows.

### Internal route access timing

Files:

- `src/App.jsx`
- `src/pages/InternalDraftInboxPage.jsx`
- `src/pages/InternalDraftDetailPage.jsx`
- `src/pages/InternalApprovedActivityPage.jsx`

What changed:

- `InternalToolRoute` is now mounted at route composition level.
- Internal page components are mounted only after the route guard confirms
  access.
- Page-level duplicate wrappers were removed.

Risk reduced:

- Normal users should not trigger internal page data-loading effects before
  internal access is confirmed. Backend/RLS remains the actual security
  boundary.

### Runtime contract checks

File:

- `scripts/runtime-contract-audit.mjs`

What changed:

- The contract audit now reads all SQL files under `supabase/sql`.
- It checks that:
  - public contact reads use `activity_contact_options_read`
  - the contact read view follows public catalog visibility
  - the seed helper is service-role only
  - `ensure_my_profile` validates active DIR3 ES municipalities

Risk reduced:

- Future regressions in these reviewed contracts are more likely to fail local
  checks.

## Validation Performed

Commands run successfully:

- `npm.cmd run check`
- `npm.cmd run build`
- `git diff --check`
- `git diff --cached --check`

Static scans performed:

- `rg -n "security definer|grant execute|revoke|seed_activity_draft_examples" supabase/sql`
- `rg -n "activity_contact_options" src supabase/sql`
- `rg -n "activity_contact_options" src scripts supabase/manual supabase/sql`
- `rg -n "sessionStorage\\." src`
- `rg -n "C:\\\\Users\\\\|/Users/" scripts`
- Roquetes/Sant Pere references in `src/services/municipalityService.js`
- Internal route guard references in `src/App.jsx` and internal pages
- Basic debug/console scans in `src`

Validation notes:

- `npm.cmd run check` and `npm.cmd run build` both pass.
- Vite still reports the known main chunk warning, around 530 kB.
- No live Supabase or Vercel validation was performed in this local pass.

## Deployment And Rollout Notes

Recommended order:

1. Apply municipality metadata SQL and DIR3 seed/update SQL if the target
   Supabase project does not already have active DIR3 ES municipality rows.
2. Apply `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`.
3. Deploy the frontend containing `e047b34` or later.
4. Confirm OAuth dashboard links still include the canonical public trust pages:
   `/privacidad` and `/terminos`.
5. Run public catalog/contact smoke checks.
6. Run protected onboarding and internal Draft Inbox smoke checks with a real
   authorized internal user.

Production contact-read incident note:

- If the frontend containing `e047b34` is already live and contact reads fail
  with `PGRST205` for `public.activity_contact_options_read`, apply the
  standalone contact-read hotfix first:
  `supabase/sql/2026-05-14_activity_contact_options_read_hotfix.sql`.
- This unblocks the public contact contract without depending on the internal
  RPC privilege changes in the broader hardening SQL.
- The full hardening SQL remains the complete follow-up patch once the target
  project has the expected internal RPC/functions available.

Rollout constraints:

- The hardening patch assumes the earlier SQL functions already exist.
- `ensure_my_profile` hardening assumes municipality metadata and DIR3 codes are
  present for valid onboarding municipalities.
- `seed_activity_draft_examples(uuid)` must be run only through an admin or
  service-role path.

## Remaining Known Follow-Ups

Fix before public testing:

- Apply and validate the SQL patches in the real Supabase project.
- Validate profile onboarding with real municipality rows.
- Validate public contact reads through `activity_contact_options_read`.
- Validate internal Draft Inbox routes with a real internal user.

Defer:

- Vite main chunk warning around 530 kB.
- Footer composition remains route-by-route maintainability debt.
- Broader asset and performance cleanup.
- A proper locality/area model for Les Roquetes instead of the temporary
  synthetic onboarding exception and heuristic catalog detection.

## Quick Answers For Review

1. P1 seed helper closed with real `REVOKE` / `GRANT`: yes.
2. Safe contact view created: yes, `activity_contact_options_read`.
3. `ensure_my_profile` rejects arbitrary `city_id`: yes.
4. Checks passed: yes.
5. Push/live validation done by the local fix pass: no.
