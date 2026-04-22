# Internal Draft Inbox Smoke

## Scope

- Branch context: `feat/internal-draft-inbox`
- Goal: validate Draft Inbox Phase 1 after applying the new SQL in Supabase
- Required SQL:
  - `supabase/sql/2026-04-21_real_db_auth_phase.sql`
  - `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql`

## Pre-Run Setup

1. Apply the SQL files in Supabase.
2. Confirm the target internal user already has a row in `public.user_profiles`.
3. Run the seed helper in Supabase SQL editor:

```sql
select public.seed_activity_draft_examples('<internal-user-uuid>');
```

4. Confirm the same user now has a row in `public.internal_tool_access`.

## Smoke Cases

### Access control

1. Open `/internal/drafts` while anonymous.
2. Expected:
   - the route does not reveal drafts
   - the normal auth gate is offered first

3. Sign in with a user that does not have `internal_tool_access`.
4. Open `/internal/drafts`.
5. Expected:
   - explicit “no access” state
   - no draft data visible

### Inbox list

1. Sign in with the seeded internal user.
2. Open `/perfil`.
3. Expected:
   - a Draft Inbox entry is visible
4. Open `/internal/drafts`.
5. Expected:
   - at least 3 drafts visible
   - cards show id, source type, status, confidence, created date

### Draft detail save

1. Open a `pending_review` draft.
2. Change one editable field and `review_notes`.
3. Click `Save draft`.
4. Expected:
   - success feedback
   - refresh keeps the draft in `pending_review`
   - edited values remain visible after refresh

### Draft reject

1. Open a `pending_review` draft.
2. Click `Reject draft`.
3. Expected:
   - success feedback
   - draft status becomes `rejected`
   - form becomes read-only
   - `Approve` and `Reject` can no longer be used

### Draft approve

1. Open a valid `pending_review` draft.
2. Ensure required publish fields are filled:
   - `title`
   - `description`
   - `center_id`
   - `category_id`
   - `type_id`
   - `schedule_label`
   - age fields consistent with `age_rule_type`
3. Leave `image_url` empty on purpose for one approval case.
4. Click `Approve`.
5. Expected:
   - success feedback with created activity id
   - draft status becomes `approved`
   - `approved_activity_id` is visible
   - form becomes read-only

### Database verification

1. Check `public.activity_drafts`.
2. Expected:
   - rejected draft has `review_status = 'rejected'`
   - approved draft has `review_status = 'approved'`
   - approved draft has non-null `approved_activity_id`

3. Check `public.activities` for the approved id.
4. Expected:
   - exactly one new row
   - empty `image_url` was normalized to `/placeholders/activity-card-placeholder.svg`

5. Attempt to approve the same draft again through the UI.
6. Expected:
   - no second approval path available

## Build Validation

Run:

```powershell
npm.cmd run build
```

Expected:

- build completes successfully
- no repo-tracked file is rewritten by the build
