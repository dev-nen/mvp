# Technical Debt

This file lists current, relevant debt and known gaps. It is not a backlog of every possible improvement.

| Area | Current debt or gap | Why it matters now |
| --- | --- | --- |
| Catalog source | The active catalog is still served from `src/data/catalogFallback.js` through frontend enrichment | The product still lacks a real backend catalog source in `main` |
| Runtime contract | `catalogService` injects `center_name`, `city_name`, and `city_slug` as runtime aliases | Current UI depends on frontend-added aliases rather than backend-backed truth |
| Free-state signal | `is_free` is not present in the normal fallback/runtime shape | Free badge logic exists in UI, but the signal is usually absent |
| Placeholder coverage | The public card/detail path uses the SVG placeholder, but the non-public `CatalogActivityCard` still falls back to `/placeholder.jpg` | A missing-image path still exists outside the newer public-card flow |
| Detail architecture | Detail remains split between Home modal and Favorites page | The shared view model helps, but the experience is still not a single closed detail system |
| Detail scope | Later detail phases remain open even though structural alignment work is merged | There is a risk of overstating current detail work as complete |
| Auth operations | Base auth is in code, but depends on external Supabase and Google OAuth configuration | Code presence does not guarantee reliable operation in every environment |
| Profile model | Profile currently reflects auth/session state only | There is no fuller app-profile persistence, edit flow, or backend-backed profile model |
| Favorites model | Favorites remain browser-local | Current favorites do not follow the authenticated user across devices or sessions |
| PVI availability | PVI depends on `activity_events` and valid Supabase config, while the route is public today and intentionally has no browser-local fallback | Internal-style analytics remain partial and not fully hardened; in the current environment Supabase is returning `PGRST205` because `public.activity_events` is missing |
| Presentation rules | Age and presentation rules are distributed across generic helpers and surface-specific logic | The runtime still carries more than one presentation contract boundary |
| Tooling | `package.json` currently exposes no test or lint scripts | Verification is mostly manual and regressions are easier to miss |

## Debt That Is Visible But Intentionally Deferred

- Replacing the current fallback catalog with a real backend source
- Moving favorites from local-only persistence to user-linked persistence
- Completing later auth/profile phases beyond the current base integration
- Hardening PVI as a true internal surface
- Reopening PVI only after `activity_events` exists and is readable in Supabase
- Collapsing runtime aliases into cleaner backend-facing contracts
