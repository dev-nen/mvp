# Scout Draft Inbox Phase 1 SDD

## Scope Note

This document is a spec-first planning artifact grounded in the current
checked-out state of `feat/real-db-auth-migration`.
Baseline checked on April 22, 2026 against the active branch working tree.
It does not implement Draft Inbox.
It defines the implementation contract for the first viable internal moderation
phase.

## Status

- `Planned`

## Branch Context

- Active branch for this planning pass: `feat/real-db-auth-migration`
- The active branch is the implementation baseline for this spec
- `main` is not part of this scope unless explicitly referenced later

## Inputs

- Master docs:
  - `docs/PROJECT_STATE.md`
  - `docs/ARCHITECTURE.md`
  - `docs/FEATURE_STATUS.md`
  - `docs/TECH_DEBT.md`
  - `docs/ROADMAP_IMPLEMENTATION.md`
  - `docs/SDD_WORKFLOW.md`
  - `PLANS.md`
- Related planning docs:
  - `docs/scout-draft-inbox-product-plan.md`
  - `docs/scout-sources-strategy.md`
  - `docs/real-db-auth-migration-sdd.md`
  - `docs/supabase-schema-preview-2026-04-20.md`
- Current implementation seams:
  - `src/App.jsx`
  - `src/context/AuthContext.jsx`
  - `src/components/auth/ProtectedRoute.jsx`
  - `src/services/appUsersService.js`
  - `src/services/catalogService.js`
  - `supabase/sql/2026-04-21_real_db_auth_phase.sql`

## What Is True Today In The Active Branch

- The app already has authenticated and protected routes through `AuthProvider`
  and `ProtectedRoute`.
- App-user truth already lives in `public.user_profiles`, and onboarding uses
  the RPC `ensure_my_profile(...)`.
- The public catalog already reads from the Supabase view
  `public.catalog_activities_read`.
- The repo already versions Supabase SQL in `supabase/sql/`.
- There is no internal moderation route, no draft inbox page, and no internal
  access-control model for editorial tools.
- There is no `activity_drafts` or equivalent editorial source-of-truth table.
- Current public detail uses `activity_contact_options` as the only contact
  source.
- The external schema preview shows that real `activities` inserts require
  normalized references such as `center_id`, `category_id`, and `type_id`,
  plus other mandatory fields like `description`, `image_url`,
  `age_rule_type`, and `schedule_label`.
- Repo-only evidence does not yet prove the final `activities.id`
  auto-generation contract.

## Goal

Build the minimum internal moderation capability that lets an authorized NensGo
team member:

- list drafts
- open a draft
- review raw and parsed source content
- edit the publish-ready payload
- save review changes
- reject a draft
- approve a valid draft and create a real activity

## Success Condition

This phase is successful when the following path works end to end:

- a draft exists in the database
- an authorized internal user can see it
- the user can update the reviewed payload
- the user can reject it
- the user can approve it
- approval creates one real `activities` row
- the draft keeps traceability to that created activity

## Dependency Readiness Gate

| Dependency | Status | Reading for this phase |
| --- | --- | --- |
| Existing auth and protected-route foundation | `Ready` | The app already has authenticated routes and app-user provisioning |
| Repo-tracked Supabase SQL workflow | `Ready` | SQL changes fit the current repo workflow |
| Internal access-control model for internal tools | `Partial` | There is no internal-tool authorization layer yet |
| Publish contract from draft to `activities` | `Partial` | Current schema fit is visible, but approval requirements need explicit validation |
| `activities.id` generation contract | `Blocked` | Repo-only evidence is not enough to author approval SQL blindly |
| Contact-option publication decision | `Partial` | Current detail contract uses `activity_contact_options`, but Phase 1 may omit that write on purpose |
| Automated regression tooling | `Blocked` | The repo exposes only `npm run build`; validation remains mostly manual |

Practical reading:

- Draft Inbox MVP is a viable phase.
- It is not ready to implement blindly until the approval insert contract is
  confirmed.

## In Scope

- internal route for draft list
- internal route for draft detail
- new draft source-of-truth table
- minimal internal access-control table or equivalent RLS-backed mechanism
- read, update, reject, and approve operations for drafts
- transacted approval path that creates one real activity
- seed drafts or seed instructions for manual validation

## Out Of Scope

- OCR
- prompt orchestration
- PDF or image upload UI
- storage bucket design
- email, CSV, RSS, webpage, or PDF connectors
- duplicate detection
- bulk moderation
- external or third-party submission channels
- center creation workflow
- institution creation workflow
- auto-publication
- generalized admin backoffice
- guaranteeing that approved activities already have contact options in the same
  phase

## Proposed Data Model

### `public.activity_drafts`

Minimum proposed columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` identity | Primary key |
| `source_type` | `text` | Required draft source label such as `seed`, `manual_upload`, `pdf`, `email`, `csv` |
| `source_label` | `text` | Human-readable origin label |
| `source_reference_url` | `text` | Optional URL for externally hosted sources |
| `source_file_path` | `text` | Optional stored path for later upload phases |
| `source_file_name` | `text` | Optional original file name |
| `source_mime_type` | `text` | Optional content type |
| `raw_extracted_text` | `text` | Raw extracted or seeded source text |
| `parsed_payload_json` | `jsonb` | Initial machine or seed proposal, can be incomplete |
| `reviewed_payload_json` | `jsonb` | Human-reviewed publish payload used for approval |
| `confidence_score` | `numeric(5,2)` | Optional confidence signal |
| `review_status` | `text` | Required, default `pending_review` |
| `review_notes` | `text` | Optional reviewer notes |
| `reviewed_by` | `uuid` | Nullable, reviewer id |
| `approved_activity_id` | `bigint` | Nullable FK to `public.activities(id)` |
| `created_by` | `uuid` | Required authoring user id |
| `created_at` | `timestamptz` | Required, default `now()` |
| `updated_at` | `timestamptz` | Required, default `now()` |

Recommended statuses for Phase 1:

- `pending_review`
- `approved`
- `rejected`

Do not add extra lifecycle states in this phase unless SQL and UI actually need
them.

### `public.internal_tool_access`

Minimum proposed columns:

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` | Primary key, FK to `public.user_profiles(id)` |
| `tool_name` | `text` | Required, Phase 1 value `draft_inbox` |
| `created_at` | `timestamptz` | Required, default `now()` |

Why this direction fits the branch:

- the active branch already treats `public.user_profiles` as app-user truth
- internal access should not depend on frontend-only hiding
- a narrow tool-access table is smaller and safer than inventing a full role
  system for this phase

## Publish Payload Contract

This is the main refinement versus the original proposal:

- `parsed_payload_json` may stay editorial and incomplete
- `reviewed_payload_json` must become publish-ready against the real
  `activities` contract

Recommended minimum `reviewed_payload_json` shape:

```json
{
  "activity": {
    "title": "",
    "description": "",
    "center_id": null,
    "category_id": null,
    "type_id": null,
    "image_url": "",
    "age_rule_type": "",
    "age_min": null,
    "age_max": null,
    "price_label": "",
    "is_free": false,
    "schedule_label": "",
    "venue_name": "",
    "venue_address_1": "",
    "venue_postal_code": ""
  }
}
```

Important implications:

- `city_id` should not be treated as a required publish field, because current
  catalog truth derives city through `centers.city_id`
- `center_name` alone is not enough to approve a draft
- `contact_text` is not part of `public.activities` in the current branch
- if contact publication is required later, that should write
  `activity_contact_options`, not a fake activity field

## Minimum Approval Requirements

Approval should require, at minimum:

- `activity.title`
- `activity.description`
- `activity.center_id`
- `activity.category_id`
- `activity.type_id`
- `activity.image_url`
- `activity.age_rule_type`
- `activity.schedule_label`

Conditional validation:

- `age_min` and `age_max` should only be required when the chosen
  `age_rule_type` needs them

Approval should fail safely if any required reference or mandatory field is
missing.

## Access And Security

### Frontend route protection

Proposed internal routes:

- `/internal/drafts`
- `/internal/drafts/:draftId`

These routes should be hidden from public navigation and protected in the app.

### RLS

Real protection must come from RLS, not just route hiding.

Recommended direction:

- authenticated users with a matching row in `internal_tool_access` for
  `draft_inbox` may read drafts
- the same users may update drafts
- only the same users may approve or reject drafts

### Approval path

Approval should not be a fragile multi-write sequence from the browser.

Recommended direction:

- create a dedicated RPC such as `public.approve_activity_draft(p_draft_id bigint)`
- keep approval transactional
- return the created `activity_id`

Minimum RPC responsibilities:

- verify the caller is authenticated
- verify the caller has internal draft access
- lock the target draft row
- verify current status is `pending_review`
- validate `reviewed_payload_json`
- insert the activity row
- update the draft with:
  - `review_status = 'approved'`
  - `reviewed_by = auth.uid()`
  - `approved_activity_id = new_activity_id`
  - `updated_at = now()`

### Rejection path

Rejection may stay as a simple update in Phase 1 if RLS is safe enough.
If implementation clarity benefits from symmetry, a small rejection RPC is also
acceptable.

## UI Scope

### Draft list page

Minimum visible fields:

- draft id
- source type
- suggested title or fallback label
- review status
- confidence score
- created at

### Draft detail page

Minimum visible areas:

- source metadata
- raw extracted text
- parsed payload
- reviewed publish form
- review notes

### Draft actions

Required actions:

- save draft
- reject draft
- approve draft

## Expected Repo Touch Surface

Expected SQL artifact:

- `supabase/sql/2026-04-22_scout_draft_inbox_phase1.sql`

Expected frontend touch surface:

- `src/App.jsx`
- `src/components/auth/ProtectedRoute.jsx` or a new internal-tool route guard
- `src/pages/InternalDraftInboxPage.jsx`
- `src/pages/InternalDraftDetailPage.jsx`
- `src/features/scout-drafts/`
- `src/services/internalDraftsService.js`
- `src/services/internalDraftApprovalService.js`
- `src/services/internalToolAccessService.js`

Suggested feature folder direction:

- `src/features/scout-drafts/`

Do not mix this new internal workflow into public catalog components unless a
shared helper is genuinely reusable.

## Seed And Testability Strategy

Because Phase 1 excludes upload and OCR, it needs seeded drafts for validation.

Recommended seed set:

- one reasonably complete draft
- one incomplete draft with unresolved publish references
- one ambiguous or low-confidence draft

If contact publication is deferred, at least one seed should make that tradeoff
visible during review.

## Validation

Automated validation available in repo:

- `npm run build`

Manual validation required:

- non-authenticated user cannot access internal draft routes
- authenticated user without internal access cannot read drafts
- authorized internal user can list drafts
- authorized internal user can open a draft
- save persists `reviewed_payload_json` and notes
- reject changes status to `rejected`
- approve a valid draft creates exactly one `activities` row
- approve cannot be executed twice on the same draft
- draft stores the created `approved_activity_id`

Database validation required:

- RLS blocks unauthorized reads and writes
- approval leaves activity and draft in a consistent state
- rejected drafts remain traceable and editable only if that policy is intended

## Definition Of Done

This phase is `Done` only when:

- an internal draft route exists
- `activity_drafts` exists
- internal draft access is enforced server-side
- internal users can list, open, save, reject, and approve drafts
- approval creates a real activity
- the approved draft records `approved_activity_id`
- the SQL and frontend changes are versioned in repo
- the project still builds

## Pending After Closure

- Scout Manual v0 for draft creation from a real source
- contact-option publication policy, if Phase 1 intentionally skips it
- center or institution creation workflow, if future drafts need new entities
- duplicate handling once connector volume grows
