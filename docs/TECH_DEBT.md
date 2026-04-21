# Technical Debt

This file lists current, relevant debt and known gaps in
`feat/real-db-auth-migration`. It is not a backlog of every possible
improvement.

| Area | Current debt or gap | Why it matters now |
| --- | --- | --- |
| Supabase readiness | The branch depends on repo-tracked SQL that still needs to be applied and validated in a live Supabase project | Code alignment alone does not make the product operational |
| Auth readiness | Google, email/password, redirect URLs, and email verification still depend on external Supabase configuration | Expanded auth is implemented in code but not yet fully validated end to end |
| Vercel readiness | `SUPABASE_SERVICE_ROLE_KEY` and `INTERNAL_PVI_API_TOKEN` still need real environment setup and validation | The private metrics path is only trustworthy after server-side validation |
| Catalog contract | The frontend now depends on `catalog_activities_read` and still derives some UI-facing aliases such as `city_slug` | The read model must stay stable enough for the UI contract |
| Detail architecture | Detail remains split between Home modal and Favorites routed page | The branch shares view-model logic, but it is still not a single closed detail surface |
| Contact data quality | Contact CTA behavior depends entirely on activity-level `activity_contact_options` quality in Supabase | Missing or malformed options now directly affect the public product path |
| Profile model | Profile readiness is now real app state, but richer editing remains out of scope | The product still lacks a broader account-management surface |
| Internal metrics validation | `/api/internal/pvi` exists, but the final server-side contract and Vercel rewrite behavior still need live verification | Internal reporting is implemented but not yet proven in the target environment |
| Tooling | `package.json` still exposes no test or lint scripts | Verification remains mostly manual and regressions are easier to miss |

## Debt That Is Visible But Intentionally Deferred

- Change-email flow
- Account linking between providers
- Magic link auth
- Favorite analytics events
- Public or third-party metrics visibility
- Collapsing the split detail experience into a single final surface

