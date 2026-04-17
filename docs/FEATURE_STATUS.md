# Feature Status

## Documentation Scope Note

This documentation reflects the current merged state of `main` at the time of writing.
Baseline checked on April 17, 2026 against `main` at HEAD `bff3c62`.
Statuses below describe the current baseline, not older branch intent.

## Status Legend

- `Done`
- `In progress`
- `Partial`
- `Planned`
- `Blocked`

## Current Feature Table

| Feature | Status | Current scope in `main` | Notes and gaps |
| --- | --- | --- | --- |
| Branding | Done | NensGo branding is active across current app surfaces and assets | Brand evolution can continue later, but the current rebrand baseline is already merged |
| Public catalog | Done | Home exposes the current landing plus searchable/filterable public catalog | Current source is frontend fallback data, not backend catalog |
| Public catalog card | Done | Home uses the teaser public card contract with current approved content blocks | This is the current public-card baseline, not a richer logged-in card |
| Card fallback rules | Done | Public catalog applies current validity rules and SVG placeholder fallback | Non-public card placeholder coverage still has debt outside the public flow |
| Detail MVP 2.0 | Partial | Detail is structurally aligned in two current surfaces: Home modal and Favorites detail page | Detail MVP 2.0 remains partially implemented and split between modal and favorites page; later detail/auth phases remain open |
| Favorites | Partial | Users can save activities locally and revisit them on protected favorites routes | Persistence is still browser-local and not linked to a user account |
| Profile | Partial | `/perfil` shows current auth/session state and current city metadata when available | There is no fuller persisted profile model yet |
| PVI | Partial | `/pvi` already has the current graceful unavailable-state UI and can read interaction metrics from `activity_events` when Supabase is ready | No browser-local fallback exists; backend readiness is pending and the current environment is blocked by missing `activity_events` |
| Auth base | Partial | Supabase Auth plus Google is implemented in `main`, including protected routes/actions and city completion | Externally configuration-dependent; not yet the full auth roadmap |
| Roadmap toward fuller MVP 2.0 and beta | In progress | Several supporting lines are already merged, but user-linked data and backend phases remain open | Current `main` mixes implemented work, partial work, and planned phases |
| Backend catalog real | Planned | No real backend catalog fetch is active in the current runtime | Current catalog still comes from local fallback data |
| Favorites by user | Planned | No per-user favorites persistence exists yet | Depends on later user/profile/backend work |
| Full detail line beyond the current split surfaces | Planned | Current detail behavior exists, but broader later detail phases remain open | Should build on top of stable auth and user persistence rather than skipping ahead |
