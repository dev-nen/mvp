# Approved Activity Lifecycle Implementation Evidence

## Scope

- Date: `2026-04-22`
- Branch context: `feat/internal-draft-inbox`
- Closure mode: `Repo implementation`

## Implemented In Repo

- SQL artifact added:
  - `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
- Frontend added:
  - internal route `/internal/activities/:activityId`
  - approved activity page for internal edit/publish lifecycle
  - service layer for approved activity read/edit/unpublish/republish
  - publication-state badges in the inbox and approved draft detail
- Docs added or updated:
  - approved activity lifecycle SDD
  - master docs for state, architecture, roadmap, debt, and feature status

## Local Validation Completed

### Build

- Command used:

```powershell
npm.cmd run build
```

- Result:
  - `PASS`
- Notes:
  - Vite build completed successfully
  - chunk-size warning remained informational only
  - no repo-tracked generated artifact changes were left behind

## External Validation Still Pending

The following were not validated from inside the repo alone:

- applying `2026-04-22_internal_approved_activity_lifecycle_phase2.sql` in the
  target Supabase project
- confirming the new lifecycle RPCs execute correctly for a real internal user
- validating live edit of an approved activity
- validating unpublish removes the row from `public.catalog_activities_read`
- validating republish restores the same row to `public.catalog_activities_read`

## Practical Reading

- Repo implementation status: `Done`
- Live environment validation status: `Partial`
- Next validation artifact to use:
  - `tests/manual/approved-activity-lifecycle-smoke.md`
