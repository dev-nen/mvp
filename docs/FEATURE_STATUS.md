# Feature Status

## Documentation Scope Note

This documentation reflects the current checked-out working state of `main`.
Baseline rechecked on April 23, 2026 after consolidating
`feat/real-db-auth-migration` and `feat/internal-draft-inbox` into `main`.
Statuses below describe the current `main` baseline, not the older pre-merge
branch split.

## Status Legend

- `Done`
- `In progress`
- `Partial`
- `Planned`
- `Blocked`

## Current Feature Table

| Feature | Status | Current scope in `main` | Notes and gaps |
| --- | --- | --- | --- |
| Branding | Done | NensGo branding remains active across the current app surfaces and assets | Brand evolution can continue later, but the current baseline is already merged |
| Public catalog UI | Done | Home exposes the current landing plus searchable/filterable public catalog UI | UI path is active and compiled against the Supabase read model |
| Backend catalog real path | Partial | Runtime catalog reads now target `catalog_activities_read` instead of local fallback data | Still externally blocked until the SQL is applied and validated in Supabase |
| B2B centers landing route | Partial | `/para-centros` still exists as a public preparatory landing with isolated layout and external join CTA | It remains intentionally separate from `/` and broader distribution is still deferred |
| Public catalog card | Done | Home uses the current public teaser card contract | The active card no longer depends on fallback catalog truth |
| Detail MVP 2.0 | Partial | Detail remains structurally aligned across Home modal and Favorites detail page | The split-surface detail model remains intentional debt in this phase |
| Contact CTA real path | Partial | Contact now comes only from `activity_contact_options` with direct/single and chooser/multi behavior | Full validation still depends on live data quality in Supabase |
| Favorites by user | Partial | Favorites are now modeled as remote user-linked data in `user_favorite_activities` | Still pending live SQL readiness and end-to-end validation |
| Profile | Partial | `/perfil` reflects auth state plus app-profile readiness from `user_profiles` | Richer profile editing is still out of scope |
| Auth expansion | Partial | Google plus email/password flows are implemented in code, including verification-pending and onboarding-required states | Still depends on Supabase provider setup, redirects, and verification config |
| Internal Draft Inbox | Partial | Internal routes, guard, services, review form, approval path, and Phase 1 SQL artifacts are implemented in repo | Still depends on applying the SQL, granting internal access rows, seeding drafts, and running live validation in Supabase |
| Approved activity lifecycle | Partial | Internal approved-activity route plus edit, unpublish, and republish RPC contracts are implemented in repo | Still depends on applying the phase 2 SQL and validating public catalog disappearance/reappearance in Supabase |
| Public surface hardening | In progress | A first pass already retired the public `/pvi` route and removed debug-like copy from Home, Favorites, Profile, Support, public detail, and the `/para-centros` preview modal | The guardrail remains active and future public surfaces still need the same standard |
| Private internal metrics path | Partial | `api/internal/pvi` exists for PO/DEV reporting with bearer-token protection | Requires Vercel server secrets and live validation |
| Roadmap toward fuller MVP 2.0, Draft Inbox, and beta | In progress | `main` closes a large migration checkpoint and adds internal editorial slices for draft approval plus approved-activity lifecycle, but external readiness and later Scout phases remain open | This is not production-ready closure yet |
