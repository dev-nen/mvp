# Contact Options Verification - Branch Preview

## Scope

- Date: `2026-04-22`
- Branch context: `feat/real-db-auth-migration`
- Local branch under test: `feat/real-db-auth-migration`
- Local `HEAD`: `1985d3e9976b4a9925302f82c4aaee960765a1f2`

## Environment Alignment

- Vercel project: `mvp-nen`
- Vercel deployment id: `dpl_3fZkhHRaf5TLF6hQyKALKFHq3d4x`
- Branch alias:
  `mvp-nen-git-feat-real-db-auth-migration-dibrandons-projects.vercel.app`
- Direct deployment URL:
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
  verification

## Activities Checked

Current anon catalog rows visible through `catalog_activities_read`:

1. `id=6` `Taller ambiguo de prueba`
2. `id=5` `Kumon (Matematicas-Lectura-English)`
3. `id=2` `Teatro para ninos y preadolescentes`

Cases tied to verification:

- single-contact case A:
  - `id=2`
  - `title=Teatro para ninos y preadolescentes`
- single-contact case B:
  - `id=5`
  - `title=Kumon (Matematicas-Lectura-English)`
- zero-contact control:
  - `id=6`
  - `title=Taller ambiguo de prueba`

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
- there was no evidence of a string/number mismatch causing the current result
- there was no evidence of an error being hidden and misrendered as `0 contactos`

## Backend Evidence

Anon reads against `activity_contact_options` returned:

| Scope | Result |
| --- | --- |
| table-wide | `count = 2`, `error = null` |
| `activity_id = 2` | `count = 1`, `error = null` |
| `activity_id = 5` | `count = 1`, `error = null` |
| `activity_id = 6` | `count = 0`, `error = null`, `data = []` |

Visible active rows:

1. `id=1`, `activity_id=2`, `contact_method=WhatsApp`,
   `contact_value=+34619873072`
2. `id=2`, `activity_id=5`, `contact_method=WhatsApp`,
   `contact_value=+34617174907`

Additional control check:

- activity `id=2` still has center-level contact data in `centers`
  - `contact_email = info@elretirositges.cat`
  - `contact_phone = +34 93 894 01 37`
- activity `id=5` did not expose center-level phone or email in the same check

Practical reading:

- `activity_contact_options` is readable in the checked project
- the current rows prove the browser-facing query is reading real activity-level
  contact data
- the `0 contactos` case for activity `id=6` is still coming from missing
  activity-level rows, not from RLS denial and not from a query failure
- center-level contact is still not part of the active contract

## UI Outcome By Executable Case

### Case 1: `1 contacto`

- activity used: `id=2` `Teatro para ninos y preadolescentes`
- DB rows in `activity_contact_options`: `1`
- UI outcome expected:
  - direct single-contact CTA state
  - button rendered as `Contactar`
  - no chooser modal expected because there is only one active option
- click outcome:
  - direct WhatsApp handoff
  - expected target:
    `https://wa.me/34619873072?...`

### Case 2: `1 contacto` control

- activity used: `id=5` `Kumon (Matematicas-Lectura-English)`
- DB rows in `activity_contact_options`: `1`
- UI outcome expected:
  - same direct single-contact CTA state
  - button rendered as `Contactar`
- click outcome:
  - direct WhatsApp handoff
  - expected target:
    `https://wa.me/34617174907?...`

### Case 3: `0 contactos`

- activity used: `id=6` `Taller ambiguo de prueba`
- DB rows in `activity_contact_options`: `0`
- UI outcome expected:
  - honest copy indicating there is no published contact path
  - no operational CTA button
- click outcome:
  - no contact button is rendered, so no contact action fires

### Case not executable in the checked backend snapshot

- `>1 contactos`

Reason:

- the checked project still has no activity with more than one active published
  contact option

## Conclusion

- No code bug was demonstrated in the contact-options frontend path.
- The current web detail now supports real direct WhatsApp CTA behavior for
  `activity_id=2` and `activity_id=5`.
- The current web detail still supports honest `0 contactos` behavior for
  `activity_id=6`.
- The remaining unverified state is `>1 contactos`.
- No fallback to `centers.contact_*` should be added in this branch.
