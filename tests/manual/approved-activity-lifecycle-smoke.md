# Approved Activity Lifecycle Smoke

## Scope

- Branch context: `feat/internal-draft-inbox`
- Goal: validate the approved activity lifecycle after applying the new phase 2
  SQL
- Required SQL:
  - `supabase/sql/2026-04-21_real_db_auth_phase.sql`
  - `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql`
  - `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`

## Pre-Run Setup

1. Apply the SQL files in Supabase.
2. Confirm the target internal user already has a row in `public.user_profiles`.
3. Run the seed helper in Supabase SQL editor:

```sql
select public.seed_activity_draft_examples('<internal-user-uuid>');
```

4. Approve one valid draft from the Draft Inbox UI so that one real
   `public.activities` row exists.
5. Confirm the approved draft now has `approved_activity_id`.

## Smoke Cases

### Approved draft handoff

1. Open an approved draft in `/internal/drafts/:draftId`.
2. Expected:
   - the draft is `approved`
   - the publication state badge is visible
   - the CTA to open the approved activity is visible

### Approved activity detail

1. Open `/internal/activities/:activityId` for the linked activity.
2. Expected:
   - the page loads
   - linked draft id is visible
   - publication state is visible
   - editable publish payload is visible
   - notes field is visible

### Save approved activity

1. Change one editable field and update review notes.
2. Click `Guardar cambios`.
3. Expected:
   - success feedback
   - refresh keeps the same `activityId`
   - the edited values remain visible after refresh
   - `public.activities` reflects the updated values

### Unpublish

1. From the approved activity page, click `Despublicar`.
2. Expected:
   - success feedback
   - the same activity remains linked to the same draft
   - publication badge changes to hidden/unpublished state

3. Check catalog visibility:

```sql
select id, title, is_active, is_deleted
from public.activities
where id = <approved-activity-id>;

select id, title
from public.catalog_activities_read
where id = <approved-activity-id>;
```

4. Expected:
   - `activities.is_active = false`
   - `activities.is_deleted = false`
   - the row is absent from `catalog_activities_read`

### Republish

1. From the same approved activity page, click `Republicar`.
2. Expected:
   - success feedback
   - the same activity id is preserved
   - publication badge changes back to published

3. Check catalog visibility again:

```sql
select id, title, is_active, is_deleted
from public.activities
where id = <approved-activity-id>;

select id, title
from public.catalog_activities_read
where id = <approved-activity-id>;
```

4. Expected:
   - `activities.is_active = true`
   - `activities.is_deleted = false`
   - the same row is visible again in `catalog_activities_read`

## Build Validation

Run:

```powershell
npm.cmd run build
```

Expected:

- build completes successfully
- no repo-tracked file is rewritten by the build
