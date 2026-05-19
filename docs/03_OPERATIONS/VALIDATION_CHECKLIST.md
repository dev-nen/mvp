# Validation Checklist

## Static checks

- [ ] `git status --short --branch`
- [ ] `npm.cmd run check`
- [ ] `npm.cmd run build`
- [ ] `git diff --check`
- [ ] `git diff --cached --check`
- [ ] Search for stale claims about legacy local favorites, mock catalog truth, missing auth, or missing i18n.
- [ ] Search for fake legal/company placeholder markers from the review task list.

## CodeGraph / local index hygiene

- [ ] `.codegraph/` remains ignored.
- [ ] Generated CodeGraph DB/index/cache files are not committed.
- [ ] CodeGraph findings are verified with direct file reads before edits.
- [ ] For `M`/`L` tasks using CodeGraph, the final report mentions whether
  CodeGraph was used and any relevant limitations.

## Manual public route checks

- [ ] `/`
- [ ] `/sobre-nensgo`
- [ ] `/para-centros`
- [ ] `/privacidad`
- [ ] `/terminos`
- [ ] unknown route redirects to `/`

Check:

- page loads;
- no visible debug/internal copy;
- metadata/canonical sensible;
- footer legal links work;
- language selector works where visible.

## Auth and onboarding checks

- [ ] Google login starts correctly.
- [ ] Email/password sign-up starts correctly.
- [ ] Email verification pending state appears when expected.
- [ ] Resend verification works if configured.
- [ ] Onboarding opens after verified auth when profile is incomplete.
- [ ] `ensure_my_profile` creates/updates profile.
- [ ] No Supabase UUID is shown to the user.
- [ ] Protected intent resumes after onboarding where expected.

## Municipality checks

- [ ] Search for common municipalities such as Barcelona and Madrid.
- [ ] Results prioritize municipality name over province-wide matches.
- [ ] DIR3-coded rows are used when available.
- [ ] Fallback does not crash during schema cache rollout.
- [ ] Invalid/non-municipality city ids are rejected by live RPC.

## Roquetes checks

- [ ] Search `Les Roquetes`.
- [ ] Search `Roquetes`.
- [ ] Search `Roquetas`.
- [ ] UI shows `Les Roquetes (Sant Pere de Ribes)`.
- [ ] Persisted `city_id` resolves to Sant Pere de Ribes.
- [ ] Docs keep this marked as temporary.

## Catalog/favorites/contact checks

- [ ] Public catalog reads from `catalog_activities_read`.
- [ ] Empty/error states are user-safe.
- [ ] `short_description` remains compatibility-only and is not an editor-managed field.
- [ ] Public detail prefers full `description` and only falls back to `short_description` when `description` is empty.
- [ ] Markdown descriptions render safely in detail without raw HTML.
- [ ] Search/area/excerpt logic derives plain text from `description` instead of raw Markdown `short_description`.
- [ ] Favorite add persists to `user_favorite_activities`.
- [ ] Favorite remove deletes remote row.
- [ ] Detail opens from Home.
- [ ] Detail opens from Favorites.
- [ ] Contact with one option opens direct action.
- [ ] Contact with multiple options opens chooser.
- [ ] Contact with zero options hides operational CTA.
- [ ] Contact event writes to `activity_contact_events`.

## i18n checks

- [ ] ES is default.
- [ ] CA switch works.
- [ ] EN switch works.
- [ ] `nensgo.language` persists if storage is available.
- [ ] App does not crash when storage is unavailable.
- [ ] `<html lang>` changes.
- [ ] Activity/center/city names remain untranslated.
- [ ] `NensGo` remains untranslated.

## Legal/SEO checks

- [ ] Canonicals use `https://nensgo.com`.
- [ ] `public/sitemap.xml` includes public routes.
- [ ] `public/robots.txt` blocks protected/internal routes.
- [ ] No `hreflang` is added without URL-based i18n.
- [ ] `/privacidad` and `/terminos` render legal copy.
- [ ] No fake company/legal data appears.

## Supabase/RLS smoke checklist

- [ ] anon can read `catalog_activities_read`.
- [ ] anon can read `activity_contact_options_read`.
- [ ] anon cannot read raw `activity_contact_options`.
- [ ] anon cannot access favorites.
- [ ] authenticated can read/write only own favorites.
- [ ] authenticated can execute `ensure_my_profile`.
- [ ] non-internal authenticated user cannot read Draft Inbox.
- [ ] internal authorized user can read Draft Inbox.
- [ ] non-internal authenticated user cannot call `list_internal_admin_activities`, `publish_internal_admin_activity`, or `unpublish_internal_admin_activity`.
- [ ] internal authorized user can list non-deleted activities, including despublicadas, from `/internal/activities`.
- [ ] internal authorized user can despublicar/republicar by RPC and public `catalog_activities_read` keeps filtering despublicadas.
- [ ] internal authorized user can create an activity draft from `/internal/drafts/new`.
- [ ] non-internal authenticated user cannot insert `activity_drafts`.
- [ ] draft cover upload requires internal access, accepts JPG/PNG/WebP, rejects SVG, and stores only a path/reference.
- [ ] internal lifecycle RPCs enforce `internal_tool_access`.
- [ ] `get_internal_pvi_report` is service_role only.

## Pre-merge checklist

- [ ] Docs updated for any changed behavior.
- [ ] No stale README claims.
- [ ] No generated secrets committed.
- [ ] Checks pass.
- [ ] Known partial/live validation gaps are explicit.
- [ ] Commit created.
- [ ] No push unless explicitly requested.
