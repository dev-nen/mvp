# Contact Options Diagnosis - Branch Preview

## Scope

- Date: `2026-04-22`
- Branch context: `feat/real-db-auth-migration`
- Closure mode: `Diagnostico real`
- Local branch under test: `feat/real-db-auth-migration`
- Local `HEAD`: `1985d3e9976b4a9925302f82c4aaee960765a1f2`

## Environment Alignment

- Vercel project: `mvp-nen`
- Vercel deployment id: `dpl_3fZkhHRaf5TLF6hQyKALKFHq3d4x`
- Branch alias:
  `mvp-nen-git-feat-real-db-auth-migration-dibrandons-projects.vercel.app`
- The branch alias is protected by Vercel authentication.
- The same deployment is directly reachable at:
  `https://mvp-953vzv7z4-dibrandons-projects.vercel.app/`
- Deployment commit ref reported by Vercel:
  `1985d3e9976b4a9925302f82c4aaee960765a1f2`
- Repo `HEAD` matched that deployment commit exactly.
- Public Supabase env used by the branch:
  - `VITE_SUPABASE_URL=https://xgvsinjbvsohnreifxcj.supabase.co`
  - project ref: `xgvsinjbvsohnreifxcj`

Practical reading:

- the checked repo state and the checked branch deployment were aligned
- the browser-facing Supabase project under test was the same one queried for
  diagnosis

## Activities Checked

Current anon catalog rows visible through `catalog_activities_read`:

1. `id=5` `Kumon (Matematicas-Lectura-English)`
2. `id=2` `Teatro para ninos y preadolescentes`

Primary failing case tied to the preview modal screenshot:

- activity id: `2`
- title: `Teatro para ninos y preadolescentes`
- matching visible fields:
  - `center_name = Societat Recreativa El Retiro`
  - `city_name = Sitges`
  - `schedule_label = Miercoles de 17:00 a 18:15`
  - `price_label = Desde 40 EUR/mes`
  - `venue_address_1 = Angel Vidal 17`

Secondary control case:

- activity id: `5`
- title: `Kumon (Matematicas-Lectura-English)`

## Frontend Path Verification

### Catalog modal path

- `HomePage` resolves protected intent with:
  `String(activity.id) === resolvedIntent.activityId`
- when the intent matches, it stores the original catalog object in
  `selectedActivity`
- `ActivityDetailModal` passes `activity?.id` into
  `useActivityContactOptions(activity?.id, open)`

### Favorites detail path

- `FavoriteActivityDetailPage` resolves the routed activity with:
  `activities.find((item) => String(item.id) === activityId)`
- once found, it still passes the numeric `activity?.id` from catalog data into
  `useActivityContactOptions(activity?.id, Boolean(activity && isSavedFavorite))`

### Shared query path

- shared service: `src/services/activityContactOptionsService.js`
- query shape:
  - `.from("activity_contact_options")`
  - `.select("id, activity_id, contact_method, contact_value")`
  - `.eq("activity_id", activityId)`
  - `.eq("is_active", true)`
  - `.eq("is_deleted", false)`
  - `.order("id", { ascending: true })`
- normalization only removes rows with blank `contact_method` or blank
  `contact_value`

### Error-state semantics

- the hook stores real fetch failures in `error`
- both detail surfaces render a distinct error copy plus retry button when
  `contactOptionsError` is non-empty
- the honest no-contact copy is rendered only when:
  - `contactOptionsError === ""`
  - `contactOptions.length === 0`

Practical reading:

- the checked ID wiring from UI to hook to query is internally consistent
- there was no evidence of a string/number mismatch causing the empty result
- there was no evidence of an error being hidden and misrendered as `0 contactos`

## Backend Evidence

Anon reads against `activity_contact_options` returned:

| Scope | Result |
| --- | --- |
| table-wide | `count = 0`, `error = null` |
| `activity_id = 2` | `count = 0`, `error = null`, `data = []` |
| `activity_id = 5` | `count = 0`, `error = null`, `data = []` |

Additional control check:

- activity `id=2` still has center-level contact data in `centers`
  - `contact_email = info@elretirositges.cat`
  - `contact_phone = +34 93 894 01 37`
- activity `id=5` did not expose center-level phone or email in the same check

Practical reading:

- `activity_contact_options` is readable in the checked project
- the empty result is coming from missing published activity-level rows, not
  from RLS denial and not from a query failure
- activity `id=2` proves that center-level contact existing in the database is
  not relevant to the current branch contract

## UI Outcome By Executable Case

### Case 1: `0 contactos`

- activity used: `id=2` `Teatro para ninos y preadolescentes`
- DB rows in `activity_contact_options`: `0`
- UI outcome expected and observed for the checked preview state:
  - honest copy indicating there is no published contact path
  - no fake WhatsApp fallback
  - no operational contact CTA button
- click outcome:
  - no contact button is rendered, so no contact action fires

### Case 2: `0 contactos` control

- activity used: `id=5` `Kumon (Matematicas-Lectura-English)`
- DB rows in `activity_contact_options`: `0`
- UI outcome expected:
  - same honest no-contact state
  - no operational CTA
- click outcome:
  - no contact button is rendered, so no contact action fires

### Cases not executable in the checked backend snapshot

- `1 contacto`
- `>1 contactos`

Reason:

- the checked project currently has no published rows in
  `activity_contact_options`
- closure mode for this pass explicitly excluded live DB seeding or fake data

## Conclusion

- Closure: `B`
- No code bug was demonstrated in the contact-options frontend path.
- The current web detail falls into `0 contactos` because the real backend under
  this branch preview has no active published rows in `activity_contact_options`.
- No fallback to `centers.contact_*` should be added in this branch.
