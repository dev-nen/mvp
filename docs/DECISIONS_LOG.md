# Decisions Log

Short historical anchors only. Current code in `main` remains the source of truth when historical language is stronger than the present implementation state.

| Approx date | Decision | Rationale | Impact today |
| --- | --- | --- | --- |
| 2026-04-02 to 2026-04-07 | Active brand baseline moved to NensGo | Align naming, UI assets, metadata, and visible product language | Current app surfaces, assets, and storage naming use NensGo |
| 2026-04-09 | Public catalog card became a teaser surface, not a mini full-detail sheet | Preserve fast comparison and avoid resolving the whole experience from the public card alone | Home public card shows only the teaser contract plus `Ver mas` |
| 2026-04-09 | Public card shows one visible taxonomy | Keep the card scannable and decision-focused | `category_label` is the single visible taxonomy on the current public card |
| 2026-04-10 | Public catalog render is filtered by validity rules before card render | Avoid weak entries and broken catalog output | Home derives public catalog counts, filters, and grid from valid public activities only |
| 2026-04-10 | Standard placeholder asset for card/detail visuals is the SVG placeholder | Replace broken or missing-image behavior with a deterministic fallback | Public card and detail use `/placeholders/activity-card-placeholder.svg` |
| 2026-04-10 | Legacy fallback age case `open` was normalized to `all` in the audited fallback baseline | Keep public-facing age copy aligned with the approved contract | Current fallback docs and runtime baseline treat the audited age edge case as `all` |
| 2026-04-13 to 2026-04-17 | Base auth for the current MVP uses Supabase Auth plus Google as the initial provider | Smallest real auth path already supported by the current stack | `AuthContext`, Google sign-in, session bootstrap, and logout exist in `main` |
| 2026-04-16 to 2026-04-17 | Protected deeper actions require identified access and current city completion | Keep public exploration open while gating deeper actions behind a known user context | Home detail action, Favorites, and Profile go through the current access gate |
| 2026-04-17 | Current detail line stays split across two surfaces while sharing a common presentation contract | Reduce divergence without forcing a route/modal unification yet | Home modal and Favorites detail page both use the shared detail view model |
| 2026-04-17 | PVI remains Supabase-backed only until `activity_events` is real and readable | Avoid inventing a temporary browser-local analytics source that would blur the product boundary | `/pvi` now degrades gracefully when unreadable, but completion is deferred until Supabase is ready |
| 2026-04-17 | Documentation baseline must describe the current merged state of `main` | Avoid branch drift, old-commit overreach, and chat-memory dependency | Master docs now use current `main` as the baseline truth |
| Ongoing | Non-trivial work should use explicit planning discipline under Disket Standard v2 | Keep scope, touched files, validation, and pending work visible | Reflected in `SDD_WORKFLOW.md`, `AGENTS.md`, and `PLANS.md` |
