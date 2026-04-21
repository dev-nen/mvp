# Preview Smoke Test - Real DB And Auth Migration

## Scope

- Branch context: `feat/real-db-auth-migration`
- Environment: Vercel preview for the active branch
- Purpose: validate the current real-DB and auth migration path without relying
  on chat memory

## Preconditions

Before running this smoke test, confirm:

- Supabase SQL migration `2026-04-21_real_db_auth_phase.sql` was applied
- Supabase auth is configured for:
  - Google sign-in
  - email and password sign-up
  - confirm email enabled
- Supabase redirect allow list includes the active preview host or a valid
  preview wildcard
- Vercel env vars exist for:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INTERNAL_PVI_API_TOKEN`

## Known Limitation

`activity_contact_options` currently has no rows in Supabase.

That means this smoke test can validate the "no contact options" state, but it
cannot yet fully validate:

- single contact option behavior
- multiple contact options behavior

Those should be tested once contact-option data exists.

## Smoke Steps

### 1. Anonymous catalog loads from real DB

Open the active branch preview URL.

Expected:

- the catalog loads successfully
- cards come from the real Supabase read model
- the current known DB state shows 2 real activities, not the old mock set

Record:

- pass or fail
- actual URL used

### 2. Protected action opens the auth gate

From the anonymous catalog, trigger a protected action such as favorites.

Expected:

- the auth modal opens
- the modal offers:
  - Google sign-in
  - email and password sign-in
  - email and password sign-up

Record:

- pass or fail

### 3. Google login returns to the same preview host

Start Google sign-in from the preview URL.

Expected:

- auth succeeds
- the browser returns to the same preview host, not `main` and not the stable
  production host

Record:

- pass or fail
- final browser URL after auth

### 4. Incomplete profiles are forced through onboarding

Use a user that does not yet have a complete `user_profiles` row.

Expected:

- the app detects that onboarding is still required
- the user is not allowed into the normal authenticated flow until onboarding is
  completed

Record:

- pass or fail

### 5. Complete onboarding with a real city

Finish the onboarding form.

Expected:

- onboarding submits successfully
- the user is returned to the normal app flow
- the app now treats the session as ready

Record:

- pass or fail
- post-onboarding URL

### 6. Authenticated catalog still shows real DB data

After onboarding, inspect the catalog again.

Expected:

- the catalog still shows the real activities from Supabase
- the app does not fall back to the old mock catalog

Record:

- pass or fail

### 7. Favorites persist remotely

Add one activity to favorites.

Expected:

- the action succeeds
- the favorite appears in favorites UI

Then reload the page.

Expected:

- the favorite is still present after reload

Then remove it.

Expected:

- removal succeeds
- the favorite disappears after reload

Record:

- add pass or fail
- persistence pass or fail
- remove pass or fail

### 8. Detail view handles the current no-contact state cleanly

Open an activity detail surface.

Expected with current DB state:

- the page or modal loads
- the UI does not crash
- there is no fake WhatsApp fallback
- if no contact options exist, the detail surface handles that state cleanly

Record:

- pass or fail

### 9. Public PVI route is non-operational

Open `/pvi` on the same preview host.

Expected:

- the route is a public placeholder only
- it does not expose browser-side analytics data
- it does not behave like the old public dashboard

Record:

- pass or fail

## Suggested Evidence To Capture

- final URL after Google auth
- screenshot of catalog after login
- screenshot of onboarding if triggered
- screenshot of favorites persistence if relevant
- screenshot of `/pvi`

## Result Template

Use this template when reporting a run:

```md
Date:
Environment:
Preview URL:

1. Anonymous catalog from real DB: Pass/Fail
2. Auth gate opens: Pass/Fail
3. Google returns to same preview host: Pass/Fail
4. Onboarding gate for incomplete profile: Pass/Fail
5. Onboarding completion: Pass/Fail
6. Authenticated catalog still real DB: Pass/Fail
7. Favorites add/persist/remove: Pass/Fail
8. Detail no-contact state: Pass/Fail
9. PVI placeholder only: Pass/Fail

Notes:
```
