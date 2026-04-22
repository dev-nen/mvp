# Internal Draft Inbox Implementation Evidence

## Scope

- Date: `2026-04-22`
- Branch context: `feat/internal-draft-inbox`
- Closure mode: `Repo implementation`

## Implemented In Repo

- SQL artifact added:
  - `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql`
- Frontend added:
  - internal routes for `/internal/drafts` and `/internal/drafts/:draftId`
  - `InternalToolRoute`
  - `useInternalToolAccess`
  - internal Draft Inbox list and detail pages
  - Draft review form, status badge, and Draft Inbox services
- Profile route updated:
  - shows Draft Inbox entry only when the signed-in user has internal access

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

- applying `2026-04-22_internal_draft_inbox_phase1.sql` in the target Supabase
  project
- confirming live `activities.id` behavior in that project after apply
- granting a real internal user through `internal_tool_access`
- running `seed_activity_draft_examples(...)` against a real internal user id
- live smoke of:
  - `/internal/drafts`
  - `/internal/drafts/:draftId`
  - save
  - reject
  - approve
  - `approved_activity_id` traceability

## Practical Reading

- Repo implementation status: `Done`
- Live environment validation status: `Partial`
- Next validation artifact to use:
  - `tests/manual/internal-draft-inbox-smoke.md`
