# Approved Activity Lifecycle Phase 2 SDD

## Scope Note

This document reflects the current checked-out state of
`feat/internal-draft-inbox`.
Baseline checked on April 22, 2026 against the active branch working tree.
It documents the second Draft Inbox slice already implemented in repo, not a
future idealized admin system.

## Status

- `Partial`

Repo implementation exists.
Live validation still depends on applying the new SQL in Supabase and running
manual smoke checks.

## Goal

Extend Draft Inbox from "approve creates one activity" to a usable editorial
lifecycle for that approved activity.

The lifecycle for this phase is:

- approve draft -> create one activity
- edit that approved activity without creating duplicates
- unpublish it from the public catalog
- republish it back into the public catalog

## Closed Decisions

- Public catalog visibility continues to depend on `public.activities`:
  - visible when `is_active = true` and `is_deleted = false`
  - hidden when `is_active = false` and `is_deleted = false`
- This phase does not hard-delete activities.
- `activity_drafts.review_status` stays unchanged:
  - `pending_review`
  - `approved`
  - `rejected`
- An approved draft keeps one `approved_activity_id` forever.
- After approval, `public.activities` becomes the source of truth for the
  published object.
- `reviewed_payload_json` remains the editorial snapshot and must stay aligned
  when the approved activity is edited through the internal tool.

## Implemented Contract

### SQL

Repo-tracked SQL artifact:

- `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`

Implemented functions:

- `list_internal_approved_activity_states(...)`
- `get_internal_approved_activity(...)`
- `update_approved_activity_from_draft(...)`
- `unpublish_approved_activity(...)`
- `republish_approved_activity(...)`

All functions:

- require authenticated session
- require `internal_tool_access` for `draft_inbox`
- preserve the `draft -> approved_activity_id` link

### Frontend

Implemented route:

- `/internal/activities/:activityId`

Implemented behavior:

- approved draft detail now acts as handoff to the linked activity
- approved activities can be edited from a dedicated internal page
- approved activities can be unpublished and republished from that page
- inbox list surfaces whether an approved activity is currently published or
  hidden

## Current Gaps

- SQL still needs human apply in the target Supabase project
- live validation still needs to confirm:
  - approved activity edit
  - unpublish removes the row from `catalog_activities_read`
  - republish returns the same row to the public catalog
- contact publication is still out of scope
- this is not a full admin CRUD surface

## Validation Target

This phase is only truly closed when a real internal user can:

1. approve a draft
2. open the linked approved activity
3. edit and save it
4. unpublish it
5. confirm it disappears from the public catalog
6. republish it
7. confirm the same activity returns to the public catalog
