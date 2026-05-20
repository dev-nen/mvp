# Activity Admin Panel and User Submissions Spec

## 1. Status

- Product status: `En definición`.
- Implementation status: `Partial`.
- Phase 1 admin activity catalog is implemented in the repo behind `/internal/activities` and live-smoke validated against Supabase.
- The Phase 1 SQL migration and return-type hotfix migration are versioned in `supabase/sql` and were applied for the manual live smoke.
- Public anonymous submissions, contact option lifecycle, expiration lifecycle,
  provider/center ownership, and Vercel configuration remain out of scope.

### Phase 2 Core status update

- Product status: `Partial`.
- Implementation status remains `Partial` until manual Supabase SQL apply and
  live smoke validation pass.
- Phase 1 admin activity catalog is implemented and live-smoke validated for an
  internal authorized user.
- Phase 2 Core is being implemented in repo: expanded draft lifecycle,
  ownership, user-facing feedback, `/perfil/publicaciones`, owner-only
  despublicar, correction resubmission, and user edit requests.
- Provider/center account ownership, contact option lifecycle, expiration
  lifecycle, public anonymous submissions, `/sugerir-actividad`, admin
  card/list toggle, and Vercel configuration remain out of scope.

### Phase 3 Core status update

- Product status: `Partial`.
- Implementation status remains `Partial` until the Phase 3 SQL migration is
  applied manually and live Supabase/RLS smoke validation passes.
- Phase 3 adds the first normal-user submission flow from
  `/perfil/publicaciones/nueva`.
- Authenticated users can submit a new activity for NensGo review. The flow
  creates an `activity_drafts` row only; it does not publish directly and does
  not write to `public.activities`.
- Phase 3 uses `source_type = 'user_submission'` and
  `submitted_by_user_id = auth.uid()` so the existing user inbox can show the
  draft as `En revision`.
- `source_reference_url` remains optional draft traceability only and is not
  public catalog data.
- Public anonymous submissions, `/sugerir-actividad`, provider/center
  ownership, center creation, contact option lifecycle, and normal-user image
  upload/storage remain out of scope.

## 2. Problem Statement

The PO needs a practical internal activity management capability:

> Ver el catalogo completo en formato card y agregarles un boton que indique si esta publicada o no y que al tocarlo publique o despublique esa actividad del catalogo.

NensGo also needs a future path for normal users to suggest activities to the
team. User suggestions must become drafts or submissions for review, never
direct published activities.

The current Draft Inbox is not enough as a full admin activity management
surface. It supports draft review and one approved activity detail flow, but it
does not give admins a complete card-format catalog of all non-deleted
activities, including published and unpublished ones.

## 3. Vocabulary

**Draft**

An internal editorial candidate stored in `activity_drafts`. It contains source
traceability, parsed payload, reviewed payload, review status, notes, and
possibly a link to one approved activity.

**Submission**

A future user-created suggestion. It should enter the review pipeline as a draft
or draft-like record and remain separate from public catalog publication until a
NensGo-authorized admin reviews and approves it.

**Pending review**

A draft/submission is waiting for internal review. In the current repo this is
`activity_drafts.review_status = 'pending_review'`.

**Needs changes**

A future review state where NensGo needs more information or corrections before
approval. It does not exist in the current repo schema.

**Rejected**

A draft/submission was reviewed and rejected. In the current repo this is
`activity_drafts.review_status = 'rejected'`. Rejection is not the same as
unpublishing an activity.

**Approved**

A draft passed review and is linked to one activity through
`activity_drafts.approved_activity_id`. Approved is an editorial/review state,
not automatically a permanent publication state.

**Published**

An activity is visible in the public catalog. In the current repo this is
implemented by `activities.is_active = true` and `activities.is_deleted = false`
with an active, non-deleted center.

**Unpublished**

An approved activity exists but is hidden from the public catalog. In the
current repo this is implemented by `activities.is_active = false` while
`activities.is_deleted = false`.

**Archived**

A future non-active lifecycle state for drafts/submissions or activities that
should remain traceable but stop appearing in normal operational queues. It does
not exist in the current repo schema.

**Deleted**

A soft-deleted activity should stay outside public and admin-default catalog
surfaces unless an explicit recovery/audit scope includes it. The current public
catalog filters `activities.is_deleted = false`.

**Expired**

A future state for one-off or date-bound activities after their useful date has
passed. It does not exist as a complete lifecycle in the current repo.

## 4. Lifecycle Separation

Draft lifecycle is editorial/review lifecycle. It answers whether a source or
suggestion has been reviewed and what happened to it.

Activity publication state controls public catalog visibility. It answers
whether an approved activity should appear to families in the public catalog.

The current technical visibility flag is `activities.is_active`. That is
sufficient for a Phase 1 publish/unpublish implementation, but UI should use
product language:

- status badge: `Publicada` / `Despublicada`
- action: `Publicar` / `Despublicar`, or `Republicar` when returning a
  previously unpublished activity to the catalog

Do not collapse all lifecycle meaning into `is_active`:

- an approved activity is not necessarily published;
- a rejected draft is not an unpublished activity;
- a pending draft does not yet have a publication state;
- deleted, archived, and expired are separate concepts from publication.

A new `publication_status` field is not required for Phase 1. It should remain
future-only unless richer states such as scheduled publication, expired,
archived, or blocked create a real need.

## 5. Current State From Repo

Branch reviewed: `main`.

CodeGraph was used first for read-only discovery, then important findings were
verified by direct file and SQL reads.

Current internal routes in `src/App.jsx`:

- `/internal/drafts`
- `/internal/drafts/new`
- `/internal/drafts/:draftId`
- `/internal/activities`
- `/internal/activities/:activityId`

Current internal access boundary:

- `src/components/auth/InternalToolRoute.jsx`
- `src/hooks/useInternalToolAccess.js`
- `src/services/internalToolAccessService.js`
- `internal_tool_access` table
- default tool name: `draft_inbox`

Current draft pages:

- `src/pages/InternalDraftInboxPage.jsx`
- `src/pages/InternalDraftCreatePage.jsx`
- `src/pages/InternalDraftDetailPage.jsx`

Current approved activity page:

- `src/pages/InternalApprovedActivityPage.jsx`

Current internal services:

- `src/services/internalDraftsService.js`
- `src/services/draftApprovalService.js`
- `src/services/internalActivityCatalogService.js`
- `src/services/internalApprovedActivitiesService.js`
- `src/services/internalDraftCoverImageService.js`

Current public catalog service:

- `src/services/catalogService.js`
- `listActivities()` reads `catalog_activities_read`

Current card/detail components that may be reused or mirrored:

- `src/components/catalog/CatalogActivityCard.jsx`
- `src/components/ActivityCard.jsx` (legacy/simple card)
- `src/components/catalog/ActivityDetailModal.jsx`

Current status UI:

- `src/features/scout-drafts/ScoutDraftStatusBadge.jsx` handles
  `pending_review`, `approved`, and `rejected`.
- `src/features/scout-drafts/ActivityPublicationBadge.jsx` displays
  `Publicada` or `Oculta`.

Current SQL and read models:

- `supabase/sql/2026-04-21_real_db_auth_phase.sql` creates
  `catalog_activities_read` and filters public catalog rows by active,
  non-deleted activities and centers.
- `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql` creates
  `activity_drafts`, `internal_tool_access`, draft RLS policies, and
  `approve_activity_draft`.
- `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
  adds approved activity lifecycle RPCs.
- `supabase/sql/2026-05-14_security_hardening_after_defensive_audit.sql`
  hardens internal RPC grants and contact read boundaries.
- `supabase/sql/2026-05-15_internal_draft_create_markdown_cover.sql` extends
  internal manual draft creation, cover handling, markdown description fields,
  and redefines current catalog/approval/update contracts.
- `supabase/sql/2026-05-19_internal_activity_admin_catalog.sql` adds the
  internal admin catalog RPCs for listing, publishing, and unpublishing
  non-deleted activities by `activity_id`.
- `supabase/sql/2026-05-19_internal_activity_admin_catalog_type_hotfix.sql`
  replaces those RPC definitions with explicit output casts after live
  Supabase returned PostgREST error `42804` for a return-type mismatch.

Current RPCs related to activity lifecycle:

- `list_internal_admin_activities(p_publication_filter text)`
- `publish_internal_admin_activity(p_activity_id bigint, p_review_notes text)`
- `unpublish_internal_admin_activity(p_activity_id bigint, p_review_notes text)`
- `approve_activity_draft(p_draft_id bigint)`
- `list_internal_approved_activity_states(p_draft_ids bigint[])`
- `get_internal_approved_activity(p_activity_id bigint)`
- `update_approved_activity_from_draft(p_draft_id bigint, p_reviewed_payload jsonb, p_review_notes text)`
- `unpublish_approved_activity(p_draft_id bigint, p_review_notes text)`
- `republish_approved_activity(p_draft_id bigint, p_review_notes text)`

Current publication mechanism:

- Approval creates an activity with `is_active = true` and `is_deleted = false`.
- `unpublish_approved_activity` sets `is_active = false`,
  `is_deleted = false`, `updated_at = now()`, and
  `updated_by = 'draft.unpublish_approved_activity'`.
- `republish_approved_activity` sets `is_active = true`,
  `is_deleted = false`, `updated_at = now()`, and
  `updated_by = 'draft.republish_approved_activity'`.
- `publish_internal_admin_activity` and
  `unpublish_internal_admin_activity` perform the same visibility toggle by
  `activity_id` for the broader admin catalog without changing draft status.
- Internal read RPCs expose `is_published` as
  `activities.is_active = true and activities.is_deleted = false`.

Current draft lifecycle:

- Schema allows `pending_review`, `approved`, and `rejected`.
- Pending drafts can be edited.
- Approved or rejected drafts are terminal in the current UI.
- There is no `needs_changes`, `archived`, user-facing reason, or resubmission
  model in the current repo.

Remaining gaps:

- `/internal/activities` and its Phase 1 RPC contracts are implemented in repo
  and live-smoke validated for an internal authorized user. Broader RLS
  hardening checks for anon/non-internal users remain part of the reusable
  validation checklist.
- Existing approved activity RPCs are tied to Draft Inbox-managed activities via
  `activity_drafts.approved_activity_id`.
- Activities that exist outside the Draft Inbox link can be published or
  unpublished from the admin catalog, but they do not have an editable approved
  activity detail page until a separate edit flow exists.
- Contact option editing/publication is not part of the current approved
  activity lifecycle.

## 6. PO Request: Admin Complete Catalog

The requested admin catalog should:

- show all non-deleted activities;
- include published and unpublished activities;
- use card format;
- show a clear publication badge: `Publicada` / `Despublicada`;
- include a quick action: `Despublicar` for published items and `Republicar`
  or `Publicar` for unpublished items;
- be internal-only and protected by `internal_tool_access` plus server-side
  Supabase authorization;
- avoid direct public access and avoid exposing raw internal tables.

The public read model `catalog_activities_read` should not be reused for the
complete admin catalog because it intentionally filters out unpublished rows.
Phase 1 needs a new internal read model or RPC that includes
`activities.is_active = false` while excluding soft-deleted rows by default.

## 7. Recommended Phase 1

Repo implementation note: this phase now exists in the codebase as a partial
implementation. It adds `/internal/activities`,
`src/pages/InternalActivityCatalogPage.jsx`,
`src/services/internalActivityCatalogService.js`, and
`supabase/sql/2026-05-19_internal_activity_admin_catalog.sql`. The follow-up
`supabase/sql/2026-05-19_internal_activity_admin_catalog_type_hotfix.sql`
fixes the live PostgREST `42804` return-type mismatch by casting returned
values to the declared RPC contract. The internal authorized-user live smoke
passed after applying the hotfix; anon/non-internal RLS checks remain reusable
validation items, not automatically closed by this smoke.

### Objective

Build an internal admin activity catalog with card-format rows and a safe
publish/unpublish toggle for existing approved activities.

### Scope

- Internal-only route, recommended: `/internal/activities`.
- Authorized admins only.
- List all non-deleted activities, published and unpublished.
- Card grid/list using product-ready activity presentation.
- Publication badge: `Publicada` / `Despublicada`.
- Quick action: `Despublicar` / `Republicar`.
- Read model/RPC returns enough fields for admin cards.
- Toggle action uses internal RPC/service, not direct browser updates to
  `activities`.

### Non-goals

- No draft lifecycle changes.
- No user submissions.
- No contact option editing or publishing.
- No delete or bulk actions.
- No provider/center self-service.
- No public route changes.
- No new `publication_status` field.

### Data / Read Model

Create one controlled internal read contract, for example:

- `list_internal_admin_activities(...)`

Recommended default behavior:

- require authenticated caller;
- require active `internal_tool_access`;
- return non-deleted activities;
- include `is_published` derived from `is_active = true and is_deleted = false`;
- include card fields already used by `catalog_activities_read`;
- include draft linkage when available, but do not require all activities to
  have a draft link;
- support filters for all/published/unpublished in the frontend or RPC.

Do not query `catalog_activities_read` for this panel because it hides
unpublished activities by design.

### RPC / Service Approach

Reuse the current internal RPC pattern. Phase 1 can either:

- extend existing unpublish/republish RPCs so they can operate by `activity_id`
  for any non-deleted activity; or
- add new admin RPCs, for example:
  - `publish_internal_admin_activity(p_activity_id bigint, p_review_notes text default null)`
  - `unpublish_internal_admin_activity(p_activity_id bigint, p_review_notes text default null)`

Recommended implementation direction:

- keep current Draft Inbox RPCs intact for existing approved detail behavior;
- add admin-catalog-specific RPCs that operate on `activity_id`;
- preserve `updated_at`;
- set `updated_by` to a stable internal value, or an existing user-aware audit
  field if the schema supports it;
- add deeper audit/history later if the team needs visible change logs.

### UI / Card Requirements

Each admin activity card should show:

- title;
- center;
- city;
- category/type;
- age label;
- schedule;
- price/free signal;
- cover image or placeholder;
- publication badge;
- activity id for internal reference only if needed, not as user-facing copy;
- optional draft id/source label when linked to Draft Inbox;
- quick action button;
- link to existing detail/edit page when supported.

Minimum filters:

- all;
- published;
- unpublished.

Phase 1 can defer pending review, needs changes, rejected, archived, and source
type filters to later phases because those are draft/submission lifecycle
filters, not pure activity catalog visibility.

### Permissions / RLS

- Frontend route is protected by `InternalToolRoute`.
- SQL/RPC checks must verify `auth.uid()` and `internal_tool_access`.
- Public/anon users must not read the admin list.
- Normal authenticated users must not read the admin list.
- Frontend must not expose `SUPABASE_SERVICE_ROLE_KEY`.
- Browser code must not update `activities.is_active` directly.

### Acceptance Criteria

- Authorized internal user can open `/internal/activities`.
- Unauthorized authenticated user cannot load the admin catalog.
- Anonymous user is blocked before internal content mounts.
- Admin sees published and unpublished non-deleted activities.
- Public catalog still only shows published activities.
- Admin can unpublish a published activity.
- The activity disappears from `catalog_activities_read`.
- Admin can republish the same activity.
- The activity returns to `catalog_activities_read`.
- No draft status is changed by publish/unpublish.
- No contact option rows are created or edited.

### Validation Checklist

- `npm.cmd run check`
- `npm.cmd run build`
- `git diff --check`
- `git diff --cached --check`
- Manual Supabase/RLS smoke:
  - anon cannot call admin read/toggle RPCs;
  - non-internal authenticated user cannot call admin read/toggle RPCs;
  - internal authorized user can list non-deleted activities;
  - internal authorized user can publish/unpublish;
  - public catalog visibility changes as expected.

### Likely Files

- `src/App.jsx`
- `src/pages/InternalActivityCatalogPage.jsx`
- `src/pages/InternalActivityCatalogPage.css`
- `src/services/internalApprovedActivitiesService.js` or a new
  `src/services/internalActivityCatalogService.js`
- `src/features/scout-drafts/ActivityPublicationBadge.jsx` or a renamed/shared
  internal publication badge
- `src/components/catalog/CatalogActivityCard.jsx` if a reusable admin variant
  is justified, otherwise a new internal card component
- `supabase/sql/YYYY-MM-DD_internal_activity_admin_catalog.sql`
- docs updates

### Task Size

- `L`

### CODEGRAPH Recommendation

- `CODEGRAPH: true`

Reason: route, service, SQL/RPC, RLS, card, and catalog read-model impact cross
multiple ownership areas.

## Phase 1 Live Validation

Status: Phase 1 is implemented in repo and live-smoke validated for an
authorized internal user.

Branch and commits:

- `feat/internal-activity-admin-catalog`
- `737ed51 Add internal activity catalog with publish controls`
- `79507c2 Fix internal activity catalog RPC return types`

SQL involved:

- `supabase/sql/2026-05-19_internal_activity_admin_catalog.sql`
- `supabase/sql/2026-05-19_internal_activity_admin_catalog_type_hotfix.sql`

The hotfix migration was required after live Supabase/PostgREST returned error
`42804` from `list_internal_admin_activities`. The fix keeps the same RPC
contracts and casts returned values to the exact `RETURNS TABLE` types.

Manual live validation passed:

- `/internal/activities` loads.
- `Todas` shows activities.
- `Publicadas` works.
- `Despublicadas` works.
- `Despublicar` changes the card state.
- The despublicada activity disappears from the public catalog.
- `Republicar` returns the activity to the public catalog.

This validates Phase 1 only. It does not implement or validate user
submissions, contact option lifecycle, draft lifecycle expansion, expiration
lifecycle, provider self-service, or a `publication_status` field.

## 8. Recommended Phase 2

### Draft Lifecycle Clarification

Phase 2 should formalize the review workflow before user submissions create
more operational states.

Recommended decisions:

- add or standardize `needs_changes` if admins need to return a draft for
  correction instead of rejecting it;
- define whether `rejected` is terminal;
- add `archived` only if admins need to hide old drafts from normal queues;
- define if rejected or needs-changes drafts can be resubmitted;
- separate internal admin notes from user-visible feedback;
- define who can edit drafts in each state.

### Acceptance Criteria

- Draft status meanings are documented and implemented consistently.
- Draft list filters distinguish pending review, needs changes, rejected,
  approved, and archived if those states exist.
- UI copy does not confuse draft status with publication state.
- Existing approved activity publish/unpublish behavior is preserved.
- RLS/RPC checks prevent normal users from reading internal draft details.

### Phase 2 Core contract update

Phase 2 Core product decisions are now closed for implementation:

- Draft statuses are `pending_review`, `needs_changes`, `approved`,
  `rejected`, and `archived`.
- Normal users see `En revision`, `Necesita cambios`, `Publicada`,
  `Despublicada`, `No aprobada`, or `Archivada`.
- Admins may save pending review, approve, request changes, reject/no aprobar,
  and archive.
- Internal admin notes are separate from user-visible feedback and must never
  be returned by normal-user RPCs.
- User feedback has a summary plus field-level correction items in
  `user_feedback_json`; that JSON must be an array.
- The submitting user is responsible for that publication. There are no
  provider/center user entities in this phase.
- Normal users can despublicar only their own published activity. They cannot
  publish, republish, approve, archive, or manage another user's records.
- Corrections create a new linked draft/version. The old draft is preserved.
- Editing a published activity as a normal user creates a new pending review
  draft and immediately despublica the current activity until admin approval.
- Admins can manage all drafts and activities through existing internal access
  patterns.

Phase 2 Core uses nullable ownership so existing internal/manual records remain
compatible:

- `activity_drafts.submitted_by_user_id` points to the submitting app user when
  a normal user owns the submission.
- `activities.owner_user_id` points to the responsible app user when the
  approved activity came from a user-submitted draft.
- When `approve_activity_draft` approves a draft with
  `submitted_by_user_id`, the created activity sets
  `activities.owner_user_id = activity_drafts.submitted_by_user_id`.
- Existing internal/manual drafts with `submitted_by_user_id null` may keep
  `owner_user_id null`.
- `owner_user_id null` means normal users cannot manage that activity; admins
  still can.

`/perfil/publicaciones` is a protected user route, not an internal route. It
shows only the current user's own submissions/publications through sanitized
RPCs. It may show public feedback and field-level correction messages, but it
must never show `review_notes`, `internal_review_notes`, Supabase UUIDs, raw
technical errors, or other users' records.

Admin review may use reusable chips/templates for `needs_changes` and
`rejected`. Chips generate field-level items with a form field, payload path,
reason code, and user-friendly Spanish message. Admins can edit the generated
summary before sending it.

Phase 2 Core remains `Partial` until SQL is manually applied and live smoke
validation passes.

## 9. Phase 3 Core: Authenticated User Activity Submission

### Status

Phase 3 Core is implemented in the repo once the Phase 3 migrations and
frontend changes are present, but it is not live validated until SQL is applied
manually in Supabase and the smoke checklist passes.

### Objective

Allow an authenticated normal user to submit a new activity/publication from
scratch for NensGo admin review.

Core flow:

- user opens `/perfil/publicaciones`;
- user clicks `Enviar actividad`;
- user fills `/perfil/publicaciones/nueva`;
- frontend calls `create_my_activity_submission`;
- Supabase creates one `activity_drafts` row with
  `review_status = 'pending_review'` and
  `submitted_by_user_id = auth.uid()`;
- user returns to `/perfil/publicaciones`;
- the submission appears as `En revision` through
  `list_my_activity_publications`;
- admins review the draft in the existing `/internal/drafts` flow.

### Route and UI

- `/perfil/publicaciones/nueva` is a protected user route.
- It uses `ProtectedRoute`, not `InternalToolRoute`.
- It stays under the existing user publications area; Phase 3 does not add a
  public `/sugerir-actividad` route.
- Entry points are `Enviar actividad` from `/perfil/publicaciones` and user
  publication copy from `/perfil`.

### Supabase contract

`create_my_activity_submission(p_reviewed_payload jsonb, p_source_reference_url text default null)`
returns the new draft id.

The RPC:

- requires `auth.uid()`;
- is `security definer` with explicit grants to authenticated users;
- creates `activity_drafts` only;
- does not insert or update `public.activities`;
- sets `source_type = 'user_submission'`;
- sets a human-readable `source_label`;
- sets `review_status = 'pending_review'`;
- sets `submitted_by_user_id = auth.uid()` and `created_by = auth.uid()`;
- sets `revision_number = 1`;
- stores optional `source_reference_url` as draft traceability;
- stores no user feedback or internal notes for a new submission.

### Submission form

The form collects the same canonical activity fields already used by the Draft
Inbox review form: title, description, description format, center, category,
type, age rule, price/free label, schedule, venue fields, optional image URL,
and optional source reference URL.

Phase 3 users must choose an existing center, category, and type from sanitized
options. Creating a center/institution/provider is out of scope.

Image handling is text-only for an existing URL/path if the form exposes it.
Phase 3 does not add Supabase Storage upload, base64 persistence, or SVG upload
for normal users.

### User Visibility

Phase 3 uses the existing `/perfil/publicaciones` inbox. Users see only their
own submissions/publications, sanitized status, and public feedback where it
exists. They never see `review_notes` or `internal_review_notes`.

### Non-goals

- No direct normal-user publication.
- No direct normal-user writes to `public.activities`.
- No anonymous submissions.
- No public `/sugerir-actividad`.
- No provider/center account ownership.
- No center/institution creation.
- No contact option lifecycle.
- No normal-user image upload/storage.

## 10. Future User Submission Extensions

Future phases may add public discovery entry points, richer reference/contact
capture, or provider-assisted flows only after separate product decisions.

### Spam / Abuse

- require login in Phase 3;
- rate-limit later if abuse appears;
- avoid file upload until storage policy, moderation, malware/content handling,
  and quota strategy are explicit.

## 11. Phase 4 Contact Options Lifecycle

Status: `Partial` in repo until the Phase 4 SQL is manually applied and live
smoke validated.

### Product Contract

- The public CTA always says `Contactar`.
- If an activity has exactly one contact option, clicking `Contactar` opens it
  directly.
- If an activity has multiple contact options, clicking `Contactar` opens the
  chooser/modal; the CTA label still says `Contactar`.
- Contact options are reviewed before publication.
- User-submitted contact options live first in `activity_drafts`.
- Approval publishes/updates `activity_contact_options` together with the
  activity.
- Normal users never write directly to live `activity_contact_options`.
- Admin/internal users can review and edit contact options as part of Draft
  Inbox and approved activity workflows.
- `source_reference_url` remains traceability only and is not a contact option.

### Supported Contact Types

- `whatsapp`
- `phone`
- `email`
- `website`
- `instagram`

Instagram is first-class. It can be entered as `@usuario`, `usuario`, or an
Instagram profile URL. The reviewed/published value is normalized to:

```txt
https://www.instagram.com/{handle}/
```

Invalid handles, unrelated protocols, `javascript:`, `data:` and
mailto-as-instagram are rejected.

### Draft Payload

Contact options are stored in the reviewed payload:

```json
{
  "activity": {},
  "contact_options": [
    {
      "type": "instagram",
      "label": "Instagram",
      "raw_value": "@usuario",
      "normalized_value": "usuario",
      "url": "https://www.instagram.com/usuario/",
      "is_primary": false
    }
  ]
}
```

Missing `contact_options` means preserve existing live contact options during
approved activity update. An explicit empty array means the reviewed activity
has no published contact options after approval/update.

### Security Boundary

- User forms can create only draft payloads.
- Internal RPCs enforce `internal_tool_access`.
- Public reads continue through `activity_contact_options_read`.
- Raw `activity_contact_options` remains non-public and not writable by normal
  users.
- Contact events keep snapshotting the selected public contact method/value.

## 12. Recommended Phase 5

### Expiration / Date Lifecycle

Future expiration should handle one-off and date-bound activities without
overloading draft review status.

Potential capabilities:

- one-off activity date or date range;
- expiration metadata;
- admin filter for expired or soon-expiring activities;
- manual unpublish suggestion or automatic unpublish policy;
- archive/reuse strategy for seasonal recurring activities;
- public catalog continues to hide expired activities according to a documented
  rule.

This phase may be `M` if it is admin UI/manual only. It becomes `L` if it adds
automated unpublishing, scheduled jobs, new SQL lifecycle states, or public
catalog filtering rules.

## 13. Security Model

- Internal admins are authorized through `internal_tool_access`.
- Frontend route guards are UX only; Supabase RLS/RPC checks are the security
  boundary.
- Users can create/read only their own submissions if submission history is
  exposed.
- Users cannot read internal drafts or other users' submissions.
- Users cannot approve, publish, unpublish, or write directly to `activities`.
- Phase 3 user submission uses a security-definer RPC with `auth.uid()` and
  creates only the caller's draft.
- Publish/unpublish must be admin-only.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or server-only secrets.
- Do not add public debug UI or raw technical errors.
- Do not show Supabase UUIDs to end users.

## 14. Data Model Questions

Resolved decisions and remaining questions:

- Should `activity_drafts.review_status` expand beyond `pending_review`,
  `approved`, and `rejected`?
- Phase 3 expands user-submitted drafts with `source_type = 'user_submission'`.
- Phase 3 user submissions live in `activity_drafts`.
- Phase 3 uses `submitted_by_user_id` for ownership and existing public
  feedback fields from Phase 2.
- Is `is_active` enough for Phase 1 publication? Current recommendation: yes.
- Should `publication_status` remain future-only? Current recommendation: yes.
- Do current `created_by`/`updated_by` fields meet audit needs, or is a history
  table needed later?
- Should publish/unpublish operate by `activity_id` for all activities or only
  by linked `draft_id`?
- Can there be activities without `activity_drafts.approved_activity_id`, and
  should Phase 1 manage them?
- Should deleted activities be excluded from default admin catalog? Current
  recommendation: yes.
- How should archived and expired interact with `is_active`?

## 15. Implementation Roadmap

| Phase | Task size | Tooling lane | CODEGRAPH | Dependencies | Output | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Admin Activity Catalog | L | Codex CLI | true | Existing internal auth, activity data, current RPC pattern | `/internal/activities` list, admin read RPC, publish/unpublish card action | RLS, direct writes, incomplete activity coverage |
| 2. Draft Lifecycle | L | Codex CLI | true | Phase 1 clarity, PO decisions on statuses | Standardized statuses, filters, notes/reasons, resubmission rules | State ambiguity, migration compatibility |
| 3. User Submissions | L | Codex CLI | true | Phase 2 lifecycle, user RLS design | `/perfil/publicaciones/nueva`, `create_my_activity_submission`, logged-in submission form and admin review entry | Spam, privacy, cross-user reads, abuse |
| 4. Contact Options Lifecycle | L | Codex CLI | true | Contact product decisions, validation rules | Admin contact editing/publishing | Public contact leakage, bad contact data |
| 5. Expiration / Dates | M/L | Codex CLI | true if SQL/routes/shared catalog change | Date model decision | Expiry filters/actions or automated lifecycle | Unexpected public catalog hiding, scheduled job complexity |

## 16. Open Questions For PO

- Should unpublished activities remain editable?
- Should unpublished activities stay visible in admin search by default?
- Should rejected drafts be resubmittable?
- Should users see rejection reasons?
- Should users see a history of submitted activities?
- Should later submissions support anonymous users? Phase 3 answer: no.
- Should normal users be allowed to upload images later? Phase 3 answer: no.
- Should admin cards include metrics such as views, favorites, or contact
  clicks?
- Should expiration auto-unpublish one-off events?
- Should the quick action label for unpublished activities be `Publicar` or
  `Republicar`?
- Should the Draft Inbox route remain as `/internal/drafts` while the broader
  activity panel becomes `/internal/activities`? Current recommendation: yes.

## 17. Non-goals For First Implementation

- No normal-user direct publish.
- No bulk publish/unpublish.
- No hard delete or soft delete UI.
- No contact options lifecycle unless explicitly scoped.
- No provider self-service.
- No billing/subscription logic.
- No full analytics dashboard.
- No anonymous submissions.
- No normal-user image upload.
- No `publication_status` field unless Phase 1 discovery finds a hard need.
