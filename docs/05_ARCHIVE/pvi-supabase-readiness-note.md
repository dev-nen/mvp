# PVI Supabase Readiness Note

## Scope Note

This note reflects the current checked environment on `main` as reviewed on
April 17, 2026.
It documents why PVI is still `Partial`, what is already implemented in the
frontend, and what must exist before the feature should be reopened as an
active delivery line.

## Current Frontend State

The repo already contains the current PVI frontend line:

- route `/pvi`
- dashboard aggregation through `useActivityEventsDashboard()`
- event tracking calls from Home modal, catalog-card favorite action, and
  Favorites detail
- graceful unavailable state when `activity_events` cannot be read

This means the current blocker is not basic route rendering. The blocker is the
absence of a readable backend event source.

## Observed Backend Blocker

In the current environment, Supabase responds with:

```json
{
  "code": "PGRST205",
  "details": null,
  "hint": null,
  "message": "Could not find the table 'public.activity_events' in the schema cache"
}
```

Practical reading:

- `public.activity_events` is not currently available to PostgREST in this
  environment
- the frontend cannot read real PVI data from Supabase today
- the current unavailable state is expected behavior, not a frontend rendering
  defect

## Explicit Decision

PVI remains remote-only for now.

Rejected for the current baseline:

- browser-local analytics mirror
- localStorage fallback dashboard source
- any temporary frontend-only data source intended to make `/pvi` appear fully
  operational before Supabase is ready

Reason:

The team chose to keep the product boundary clear and wait for the real
Supabase-backed source of truth instead of introducing a temporary analytics
path that would later need to be removed or migrated.

## Reopen Conditions

PVI should be reopened as active implementation work only after all of the
following are true:

1. `activity_events` exists in Supabase.
2. The table matches the current frontend event shape used by
   `activityEventsService`.
3. The intended client can read the table without schema-cache or permission
   errors.
4. Writes are validated from:
   - Home detail modal
   - Home catalog-card favorite action
   - Favorites detail page
5. Only after the real backend source works should the team revisit whether
   `/pvi` should remain public or become internal/protected.

## Current Closure Reading

- PVI frontend behavior: `Partial`
- PVI backend readiness: `Blocked` outside the repo
- Local analytics fallback: intentionally deferred / rejected for now
