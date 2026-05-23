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
- [ ] Contact CTA label remains `Contactar` with one or multiple options.
- [ ] Instagram contact option opens a normalized Instagram profile URL.
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

## Phase 2 Core smoke checklist

Apply the Phase 2 Core SQL manually before these checks. Do not mark Phase 2
Core live validated until these pass.

Admin:

- [ ] internal user can open `/internal/drafts`.
- [ ] pending draft can be saved.
- [ ] pending draft can be marked `needs_changes` with public feedback.
- [ ] pending draft can be `No aprobada`/`rejected` with strong rejection feedback.
- [ ] pending/needs_changes/rejected draft can be archived.
- [ ] approved draft behavior still works.
- [ ] `/internal/activities` still loads.
- [ ] Phase 1 publish/unpublish still works.

User:

- [ ] normal user can open `/perfil/publicaciones`.
- [ ] user sees only own records.
- [ ] user sees `user_feedback_summary`.
- [ ] user sees field-level feedback.
- [ ] user does not see `internal_review_notes`.
- [ ] user does not see `review_notes`.
- [ ] user can despublicar own published activity.
- [ ] user cannot republish directly.
- [ ] user can open correction flow for `needs_changes`.
- [ ] user correction creates a new linked `pending_review` draft.
- [ ] user edit of published activity creates `pending_review` draft and unpublishes current activity.

Negative:

- [ ] anon cannot call user/admin RPCs.
- [ ] authenticated non-owner cannot unpublish another user's activity.
- [ ] authenticated non-owner cannot read another user's submissions.
- [ ] authenticated non-internal cannot call admin lifecycle RPCs.
- [ ] public catalog still reads `catalog_activities_read`.
- [ ] inactive/deleted activities remain hidden from public catalog.

## Phase 3 Core smoke checklist

Apply the Phase 3 SQL manually before these checks. Do not mark Phase 3 Core
live validated until these pass.

Preflight:

- [ ] `create_my_activity_submission` exists.
- [ ] `create_my_activity_submission` is `security definer`.
- [ ] authenticated users have execute grant.
- [ ] anon cannot execute the RPC.

Positive:

- [ ] normal user calls `create_my_activity_submission` with valid payload.
- [ ] one `activity_drafts` row is created.
- [ ] `review_status = 'pending_review'`.
- [ ] `source_type = 'user_submission'`.
- [ ] `submitted_by_user_id = auth.uid()`.
- [ ] `approved_activity_id is null`.
- [ ] no `public.activities` row is created.
- [ ] `list_my_activity_publications` returns the new draft as `En revision`.
- [ ] admin Draft Inbox sees the draft.

Negative:

- [ ] anon cannot call `create_my_activity_submission`.
- [ ] missing title fails.
- [ ] invalid `center_id` fails.
- [ ] invalid `category_id` fails.
- [ ] invalid `type_id` fails.
- [ ] invalid age range fails.
- [ ] user cannot publish directly.
- [ ] user cannot approve/archive.

UI smoke:

- [ ] login as a normal user.
- [ ] open `/perfil/publicaciones`.
- [ ] click `Enviar actividad`.
- [ ] fill a valid form.
- [ ] submit.
- [ ] user is redirected to `/perfil/publicaciones`.
- [ ] item appears as `En revision` after SQL is applied.
- [ ] admin sees it in `/internal/drafts`.

## Phase 4 Core contact options smoke checklist

Apply the Phase 4 SQL manually before these checks. Do not mark Phase 4 Core
live validated until these pass.

Preflight:

- [ ] `activity_contact_options` accepts the expected contact methods.
- [ ] `instagram` contact method is accepted.
- [ ] `website` and `form` are accepted and remain distinct contact methods.
- [ ] nullable `contact_label` is exposed through `activity_contact_options_read`.
- [ ] normal users have no broad direct write grant on `activity_contact_options`.
- [ ] approval/update functions are `security definer` where needed.

Admin:

- [ ] internal user can open a pending draft with `contact_options`.
- [ ] internal user can add a WhatsApp contact option.
- [ ] internal user can add website and form contact options with optional labels.
- [ ] internal user can add an Instagram contact option.
- [ ] requesting changes does not publish contact options.
- [ ] approving a draft publishes contact options.
- [ ] editing an approved activity can update contact options through the
  internal lifecycle.

User:

- [ ] normal user can submit an activity draft with contact options.
- [ ] normal user can enter Instagram as handle or URL.
- [ ] invalid Instagram input shows a clear error.
- [ ] normal user cannot write directly to `activity_contact_options`.
- [ ] correction/edit drafts keep contact changes unpublished until approval.

Public:

- [ ] public detail still shows `Contactar`.
- [ ] one contact option opens directly.
- [ ] multiple contact options open the chooser.
- [ ] chooser shows custom contact labels as primary button text.
- [ ] unlabeled contacts fall back to default type labels.
- [ ] chooser includes Instagram when present.
- [ ] Instagram opens the normalized Instagram URL.
- [ ] chooser spacing/alignment is coherent and option buttons are not
  artificially stretched.

Negative:

- [ ] unsafe URL is rejected.
- [ ] `javascript:` URL is rejected.
- [ ] invalid email is rejected.
- [ ] invalid Instagram is rejected.
- [ ] unapproved draft contact options do not appear publicly.
- [ ] inactive/deleted activities do not expose contact options publicly.

Phase 1 admin activity catalog evidence recorded on 2026-05-19:

- [x] authorized internal user loaded `/internal/activities`.
- [x] `Todas`, `Publicadas`, and `Despublicadas` filters worked.
- [x] `Despublicar` changed the card state and removed the activity from the public catalog.
- [x] `Republicar` returned the activity to the public catalog.
- [ ] anon/non-internal calls to the admin activity RPCs remain separate RLS checks.

## Pre-merge checklist

- [ ] Docs updated for any changed behavior.
- [ ] No stale README claims.
- [ ] No generated secrets committed.
- [ ] Checks pass.
- [ ] Known partial/live validation gaps are explicit.
- [ ] Commit created.
- [ ] No push unless explicitly requested.
