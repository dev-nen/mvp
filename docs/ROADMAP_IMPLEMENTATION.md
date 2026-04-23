# Roadmap Implementation

## Role In The Documentation Stack

Start with [ROADMAP_MASTER.md](./ROADMAP_MASTER.md) when the question is:

- where the project actually is
- how product roadmap and internal capabilities fit together
- what belongs to absorbed history versus active direction
- which blocks are ready or not ready for a future SDD

This document is narrower.

It exists to track the implementation-oriented sequencing that follows from the
master roadmap for the work already integrated into or immediately adjacent to
`main`.

## Baseline

This document is an internal implementation roadmap derived from
[ROADMAP_MASTER.md](./ROADMAP_MASTER.md), not the full project roadmap and not
a product pitch. It is grounded in the current checked-out state of `main`
after consolidating `feat/real-db-auth-migration` and
`feat/internal-draft-inbox`. It separates what is already implemented in
`main` from what is still pending external readiness or later product work.

## Already Implemented In `main`

- Real route structure for Home, Favorites, Favorites detail, Profile, PVI, and
  Support placeholder
- Public catalog UI wired to a Supabase read model instead of local fallback
- Public teaser card contract for Home catalog
- Remote favorites persistence through `user_favorite_activities`
- Expanded auth UI for Google plus email/password
- App-user truth moved to `public.user_profiles`
- Onboarding completion via Supabase RPC instead of direct frontend profile
  inserts
- Contact CTA driven only by `activity_contact_options`
- Analytics writes aligned to `activity_view_events` and
  `activity_contact_events`
- First-pass public-surface hardening on Home, Favorites, Profile, Support,
  public detail, and the `/para-centros` preview modal
- Public `/pvi` route retired from the app
- Private `api/internal/pvi` path added for PO and DEV reporting
- Repo-tracked SQL and runbook artifacts for the migration
- Repo-tracked SQL, routes, guard, services, and review UI for Draft Inbox
  Phase 1
- Repo-tracked SQL, route, services, and lifecycle UI for approved activities
  linked from Draft Inbox

These are current `main` capabilities. They should not be rediscovered as if
the repo were still on mock-backed runtime behavior.

For the broader reading of absorbed transitions, internal workstreams,
effort sizing, and SDD readiness, use
[ROADMAP_MASTER.md](./ROADMAP_MASTER.md).

## Partial Or Still Gated By External Readiness

- Supabase SQL still needs human application and live validation
- Expanded auth still needs provider configuration, redirects, and email
  verification setup
- Remote favorites still need end-to-end validation against the real database
- Draft Inbox still needs:
  - applying `2026-04-22_internal_draft_inbox_phase1.sql`
  - granting one or more internal users
  - running the seed helper and manual smoke checks
- Approved activity lifecycle still needs:
  - applying `2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
  - validating edit, unpublish, and republish against the real catalog read
    model
- Private internal metrics still need Vercel server-secret setup and live
  verification
- Detail remains split across Home modal and Favorites routed detail page

## Next Real Phase

Recommended next implementation order from `main`:

1. Apply the repo-tracked SQL in Supabase and validate the read model, RPC,
   constraints, and write-table ids for:
   - real DB and auth migration
   - Draft Inbox Phase 1
   - approved activity lifecycle Phase 2
2. Configure and validate Supabase Auth for:
   - Google
   - email/password
   - redirect URLs
   - email verification
3. Configure and validate Vercel secrets for the private metrics path.
4. Run end-to-end verification across:
   - anonymous catalog
   - Google login
   - classic sign-up and verification
   - onboarding completion
   - remote favorites
   - internal Draft Inbox list and detail
   - draft save, reject, and approve
   - approved activity edit, unpublish, and republish
   - view/contact analytics writes
   - private `/api/internal/pvi`
5. Once Draft Inbox plus approved activity lifecycle are validated, move to
   Scout Manual v0 instead of broad connector work.
6. Clean up any remaining dead code or docs drift after external validation.

## Later Phase

- Richer profile editing and account management
- Scout Manual v0 for creating drafts from simple source inputs
- First structured Scout connector after Draft Inbox is live
- Richer editorial lifecycle beyond one approved activity per draft
- Role expansion beyond the current family-user baseline
- Public or role-based metrics visibility
- More complete company/internal account lines
- Further UX consolidation of the split detail system

## Deferred Or Out Of Scope For This Migration Phase

- Change-email flow
- Account linking between providers
- Magic link auth
- Local-favorites migration
- Favorite analytics events
- Public dashboard for metrics

## Practical Reading Of The Roadmap

- "Already implemented" means the `main` code is already aligned to that
  behavior.
- "Partial" means real work exists in `main`, but the line is still gated by
  external readiness, validation, or remaining architectural debt.
- "Next" means the most defensible sequence from the current `main` state.
- "Later" means desirable, but not the immediate next implementation pass.
- "Deferred" means consciously outside the current migration phase.
