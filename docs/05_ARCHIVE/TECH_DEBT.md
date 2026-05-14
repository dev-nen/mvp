# Technical Debt

This file lists current, relevant debt and known gaps in `main` after
consolidating `feat/real-db-auth-migration` and
`feat/internal-draft-inbox`. It is not a backlog of every possible
improvement.

| Area | Current debt or gap | Why it matters now |
| --- | --- | --- |
| Supabase readiness | `main` depends on repo-tracked SQL that still needs to be applied and validated in a live Supabase project | Code alignment alone does not make the product operational |
| Auth readiness | Google, email/password, redirect URLs, and email verification still depend on external Supabase configuration | Expanded auth is implemented in code but not yet fully validated end to end |
| Municipality readiness | DIR3 municipality onboarding is implemented in repo, but the target Supabase project must have the schema, seed data, and hardened `ensure_my_profile` applied | Onboarding quality and profile validity depend on real municipality rows and live RPC validation |
| Vercel readiness | `SUPABASE_SERVICE_ROLE_KEY` and `INTERNAL_PVI_API_TOKEN` still need real environment setup and validation, and Web Analytics still needs dashboard/live collection confirmation | The private metrics path and traffic analytics are only trustworthy after target-environment validation |
| Catalog contract | The frontend now depends on `catalog_activities_read` and still derives some UI-facing aliases such as `city_slug` | The read model must stay stable enough for the UI contract |
| Catalog data freshness | When an internal approved activity is unpublished or republished, an already-open public catalog view may need a manual refresh before reflecting the new read-model state | The DB contract is correct, but the frontend does not yet actively revalidate catalog data after internal lifecycle writes |
| Detail architecture | Detail remains split between Home modal and Favorites routed page | The current repo shares view-model logic, but it is still not a single closed detail surface |
| Contact data quality | Contact CTA behavior depends on activity-level `activity_contact_options` quality exposed through `activity_contact_options_read` | Missing or malformed options now directly affect the public product path |
| Locality model | Les Roquetes/Roquetas is a temporary curated exception mapped to Sant Pere de Ribes instead of a durable locality/area model | This is acceptable for MVP validation but should not become long-term persistence design |
| i18n scope | Current i18n translates static UI copy only | Dynamic activity content remains untranslated and should not be presented as localized catalog content |
| Legal/compliance scope | Public legal/trust routes exist, but no full legal/compliance review is documented in repo | OAuth trust pages help configuration and transparency, but they do not prove legal completeness |
| Profile model | Profile readiness is now real app state, but richer editing remains out of scope | The product still lacks a broader account-management surface |
| Draft Inbox readiness | Internal Draft Inbox is implemented in repo, but still depends on manual SQL apply, internal access rows, and seed setup in Supabase | Repo code alone does not make the internal editorial workflow operational |
| Approved activity lifecycle readiness | Edit, unpublish, and republish for approved activities now exist in repo, but still depend on phase 2 SQL apply and live catalog validation | Repo code alone does not prove that approved activities cleanly enter and leave the public catalog |
| Draft publish boundary | Draft approval and approved-activity lifecycle currently manage only `activities` and intentionally skip `activity_contact_options` | The editorial loop is now broader, but still not fully complete for contact publication |
| Source creation | Draft Inbox Phase 1 still depends on seeded drafts rather than real source intake | Scout Manual v0 is still the next phase, not already delivered |
| Internal metrics validation | `/api/internal/pvi` exists, but the final server-side contract and Vercel rewrite behavior still need live verification | Internal reporting is implemented but not yet proven in the target environment |
| Web Analytics route scope | Vercel Web Analytics currently mounts at the app root and does not exclude internal routes | Internal pageview collection may be acceptable, but should remain an explicit product/ops choice before treating Analytics as final reporting |
| Tooling | `package.json` still exposes no test or lint scripts | Verification remains mostly manual and regressions are easier to miss |
| Bundle size | Vite still warns that the main chunk is over 500 kB | Performance cleanup remains useful, but was intentionally deferred from the security hardening pack |

## Debt That Is Visible But Intentionally Deferred

- Change-email flow
- Account linking between providers
- Magic link auth
- Favorite analytics events
- Public or third-party metrics visibility
- Collapsing the split detail experience into a single final surface
