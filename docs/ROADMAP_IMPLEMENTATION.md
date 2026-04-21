# Roadmap Implementation

## Baseline

This roadmap is an internal implementation roadmap, not a product pitch. It is
grounded in the current checked-out state of `feat/real-db-auth-migration` and
separates what is already implemented in the branch from what is still pending
external readiness or later product work.

## Already Implemented In The Active Branch

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
- Public `/pvi` reduced to a non-operational placeholder
- Private `api/internal/pvi` path added for PO and DEV reporting
- Repo-tracked SQL and runbook artifacts for the migration

These are active branch capabilities. They should not be rediscovered as if the
branch were still on mock-backed runtime behavior.

## Partial Or Still Gated By External Readiness

- Supabase SQL still needs human application and live validation
- Expanded auth still needs provider configuration, redirects, and email
  verification setup
- Remote favorites still need end-to-end validation against the real database
- Private internal metrics still need Vercel server-secret setup and live
  verification
- Detail remains split across Home modal and Favorites routed detail page

## Next Real Phase

Recommended next implementation order from the current branch:

1. Apply the repo-tracked SQL in Supabase and validate the read model, RPC,
   constraints, and write-table ids.
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
   - view/contact analytics writes
   - private `/api/internal/pvi`
5. Clean up any remaining dead code or docs drift after external validation.

## Later Phase

- Richer profile editing and account management
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

- "Already implemented" means the branch code is already aligned to that
  behavior.
- "Partial" means real work exists in the branch, but the line is still gated by
  external readiness, validation, or remaining architectural debt.
- "Next" means the most defensible sequence from the current branch state.
- "Later" means desirable, but not the immediate next implementation pass.
- "Deferred" means consciously outside the current migration phase.
