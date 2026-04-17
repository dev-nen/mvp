# Roadmap Implementation

## Baseline

This roadmap is an internal implementation roadmap, not a product pitch. It is grounded in the current merged state of `main` and separates what is already merged from what is only partial or still pending.

## Already Merged In `main`

- NensGo branding baseline across active app surfaces
- Real route structure for Home, Favorites, Favorites detail, Profile, PVI, and Support placeholder
- Public catalog served from local fallback data through `catalogService`
- Public teaser card contract for Home catalog
- Public card validity filtering and standard SVG placeholder fallback
- Local favorites persistence in the browser
- Activity-event tracking and dashboard plumbing for PVI
- Base auth integration with Supabase Auth and Google
- Protected routes plus protected-action gating with required city completion
- Minimal profile/auth surface

These are merged capabilities. They should not be rediscovered from chat memory as if they were still only planned.

## Partially Implemented In `main`

- Detail MVP 2.0 remains partially implemented and split between modal and favorites page
- Detail structure, mapping, and fallback rules are documented, but the broader detail line is not a fully closed product phase
- Auth base is integrated, but remains externally configuration-dependent and does not close the wider auth roadmap
- Profile exists, but only as a minimal auth-facing surface
- Favorites work, but remain browser-local rather than user-linked
- PVI exists, but depends on Supabase configuration and `activity_events`, and the route is still public today
- Catalog uses a local fallback baseline rather than a real backend catalog source

## Next Real Phase

Recommended next implementation order:

1. Stabilize auth environments and verify the current base auth flow across actual Supabase and Google OAuth setup.
2. Add a more durable app-user layer beyond the current metadata-only minimum, starting with profile and user-linked persistence boundaries.
3. Move favorites from browser-local storage toward user-linked persistence.
4. Continue the detail line on top of the auth/user model, rather than treating the current two-surface alignment as the end of the story.
5. Replace the fallback-only catalog runtime with a real backend-backed catalog path.

This order keeps the current architecture honest: user-linked detail and favorites should not be treated as fully ready before the auth and user model are stable.

## Later Phase

- Richer profile editing and persistence
- Clearer access rules beyond the current base gate
- Stronger PVI/internal access boundaries
- Cleaner backend contracts that replace current frontend aliases
- Broader business logic and beta-oriented hardening

## Deferred Or Out Of Scope For The Current Baseline

- Full backend catalog inside the current repo runtime
- User-linked favorites already operating in production reality
- Complete profile model and avatar persistence
- Full auth roadmap beyond the current base integration
- Treating current detail work as fully complete
- Treating PVI as a hardened internal admin tool

## Practical Reading Of The Roadmap

- "Merged in `main`" means the code is already present in the current baseline.
- "Partial" means real work exists in the repo, but the line is not complete and should not be documented as done.
- "Next" means the most defensible sequence from current architecture.
- "Later" means desirable, but not the immediate next implementation pass.
- "Deferred" means consciously outside the current baseline and should not be silently pulled into scope.
