# Cross-Branch State Assessment - 2026-04-22

## Scope Note

This assessment was produced from the checked-out branch
`feat/real-db-auth-migration` on April 22, 2026.
Implementation source of truth for code changes in this turn remains the active
branch.
For cross-branch review, each branch's checked-in code and docs were treated as
the source of truth for that branch only.
`main` is used here as a comparison baseline, not as the automatic source of
truth for ongoing implementation.

## Branches Reviewed

- `feat/real-db-auth-migration`
- `origin/feat/real-db-auth-migration`
- `feat/internal-draft-inbox`
- `origin/feat/internal-draft-inbox`
- `main`
- `origin/main`
- `feature/auth-base-mvp2`
- `origin/feature/auth-base-mvp2`
- `feature/nensgo-mvp-2.0`
- `origin/feature/nensgo-mvp-2.0`

Only these local and remote branches were visible in this repo at assessment
time.
No additional research, Scout, backend, or migration branches were available
locally or through the fetched `origin/*` refs.

## A. Estado Actual Real Del Proyecto

### Merged baseline in `main`

- `main` is still the merged frontend MVP baseline.
- Public catalog still uses local fallback data.
- Favorites are still browser-local.
- Auth is the earlier Supabase + Google baseline, not the later real DB/auth
  migration checkpoint.
- There is no Draft Inbox runtime, no internal editorial routes, and no Scout
  landing zone in `main`.

### Active implementation baseline in `feat/real-db-auth-migration`

- Public catalog already reads from `catalog_activities_read`.
- Favorites already read and write `user_favorite_activities`.
- Auth already includes Google plus `email/password` flows, verification
  states, onboarding gating, and `user_profiles` as app-user truth.
- Contact CTA already moved to `activity_contact_options`.
- `/pvi` is already reduced to a public placeholder and the intended reporting
  seam is `/api/internal/pvi`.
- There are still no internal Draft Inbox or approved-activity routes in this
  branch.
- The branch now also includes the card-image fix that restores real media when
  `image_url` comes back as a relative Supabase Storage path.

### Parallel ongoing branch in `feat/internal-draft-inbox`

- This branch is not just planning.
- It already adds `/internal/drafts`, `/internal/drafts/:draftId`, and
  `/internal/activities/:activityId`.
- It already adds repo-tracked SQL for `activity_drafts`,
  `internal_tool_access`, `approve_activity_draft(...)`, and the approved
  activity lifecycle RPCs.
- It already adds internal review UI, profile entry points, and service layers.
- It is still `Partial` because none of that is proven live without SQL apply,
  real internal access rows, seed data, and end-to-end smoke validation.

### What exists only partially or only on paper

- Scout Manual v0 does not exist in runtime on any reviewed branch.
- Scout connectors, OCR, upload UI, and source automation remain planning only.
- Draft Inbox exists only on `feat/internal-draft-inbox`, not on the active
  implementation branch and not on `main`.
- The project does not have one repo-global doc that explains this branch split;
  branch-specific master docs are accurate per branch, but not globally.

## B. Estado Por Workstream

| Workstream | Real status | Related branches | Advance estimate | Main blockers |
| --- | --- | --- | --- | --- |
| Catalog / cards / media | Public catalog UI is `Done` in `main`, real DB catalog path is `Partial` in `feat/real-db-auth-migration` and `feat/internal-draft-inbox` | `main`, `feat/real-db-auth-migration`, `feat/internal-draft-inbox` | High in code, Partial in live readiness | Supabase SQL apply, live read-model validation, and branch divergence on image normalization |
| Auth / profile / DB | Base auth is `Partial` in `main`; expanded auth and `user_profiles` are `Partial` but substantially implemented in the two leading branches | `main`, `feat/real-db-auth-migration`, `feat/internal-draft-inbox` | Medium-high in code, low live proof | Supabase auth configuration, redirects, email verification, and real environment validation |
| Favorites | Browser-local in `main`; remote per-user favorites implemented in the two leading branches | `main`, `feat/real-db-auth-migration`, `feat/internal-draft-inbox` | Medium in merged baseline, high in branch code, Partial overall | SQL apply, authenticated end-to-end validation |
| Detail / contact | Split detail is still intentional debt across all active lines; real contact-option path is only in the two leading branches | `main`, `feat/real-db-auth-migration`, `feat/internal-draft-inbox` | Medium | Live contact-option data quality and continued split-surface architecture |
| Analytics / PVI | `main` still carries the older browser-side read concept; the two leading branches already moved to public placeholder plus private API seam | `main`, `feat/real-db-auth-migration`, `feat/internal-draft-inbox` | Medium | Vercel secrets, live API validation, and final decision to remove public `/pvi` |
| Draft Inbox / approved activity lifecycle | Not present in `main` or the active branch; implemented in repo but not validated in `feat/internal-draft-inbox` | `feat/internal-draft-inbox` | Medium-high in code, low validated readiness | SQL apply, internal access provisioning, seed data, smoke validation, and merge-base choice |
| Scout | Planning only | `feat/internal-draft-inbox` docs only | Low in runtime, medium in planning detail | Draft Inbox validation first, then Manual v0, then connectors |

## C. Ubicacion Dentro Del Roadmap

### Fases cerradas

- Frontend MVP baseline is closed in `main`:
  - landing
  - public catalog
  - local favorites
  - base auth
  - split detail baseline
- Historical branches `feature/auth-base-mvp2` and `feature/nensgo-mvp-2.0`
  are already absorbed into `main` and into the active branch.

### Fases parcialmente avanzadas

- Real DB + auth migration is `Partial`:
  - implemented in `feat/real-db-auth-migration`
  - not merged into `main`
  - not externally validated end to end
- Draft Inbox Phase 1 is `Partial`:
  - implemented in `feat/internal-draft-inbox`
  - not merged into the active branch
  - not externally validated end to end
- Approved activity lifecycle Phase 2 is `Partial`:
  - implemented in `feat/internal-draft-inbox`
  - same external validation dependency

### Fases abiertas

- Applying and validating the current Supabase SQL stack
- Configuring live auth and Vercel secret dependencies
- Consolidating the active implementation branch with the internal editorial
  branch
- Scout Manual v0

### Fase actual estimada del proyecto

The project is not yet at "Scout implementation" phase.
The real current phase is:

- merged product baseline in `main`
- unmerged but substantial migration checkpoint in
  `feat/real-db-auth-migration`
- unmerged Draft Inbox extension on top of that checkpoint in
  `feat/internal-draft-inbox`

In practical terms, the project is still in validation and consolidation of the
real DB/auth migration, with Draft Inbox already started in parallel but not yet
closed.

### Siguiente fase logica recomendada

Do not open a new Scout phase yet.
First finish consolidation and live validation of:

- real DB/auth migration
- Draft Inbox Phase 1
- approved activity lifecycle Phase 2

Only after that should Scout Manual v0 be opened as the next serious phase.

## D. Revision Transversal De Ramas

### `main`

- Purpose apparent: merged public MVP baseline
- Status: alive as baseline, but behind current implementation work
- Unique value: stable merged reference for what is already absorbed
- Unabsorbed work: none beyond baseline
- Divergence risk: low by itself, but high if someone mistakes it for the full
  current project state

### `feat/real-db-auth-migration`

- Purpose apparent: move catalog, auth, favorites, profile, contact, and PVI
  seams onto real Supabase-backed contracts
- Status: alive and the active implementation source of truth for this turn
- Unique value: 17 commits ahead of `main`; local branch is 2 commits ahead of
  `origin/feat/real-db-auth-migration`
- Unabsorbed work: substantial and still not merged into `main`
- Divergence risk: medium because `feat/internal-draft-inbox` continues on a
  sibling line and currently misses the latest card-image fix

### `feat/internal-draft-inbox`

- Purpose apparent: add internal editorial review routes and SQL on top of the
  real DB/auth migration
- Status: alive, same visible state locally and on `origin`
- Unique value: 28 commits ahead of `main` and 13 commits ahead of
  `feat/real-db-auth-migration`
- Unabsorbed work: substantial; this is the only branch with actual Draft Inbox
  and approved activity lifecycle runtime
- Divergence risk: high because it is not merged into the active branch and it
  still carries the old relative-image normalization instead of the fixed one

### `feature/auth-base-mvp2`

- Purpose apparent: earlier auth/detail checkpoint before the newer master-doc
  system existed
- Status: frozen and absorbed
- Unique value: historical only
- Unabsorbed work: none; `main` is 8 commits ahead and this branch has no
  unique commits left versus `main`
- Divergence risk: low

### `feature/nensgo-mvp-2.0`

- Purpose apparent: earlier MVP 2.0 UI/detail checkpoint before the newer
  branch-doc baseline existed
- Status: frozen and absorbed
- Unique value: historical only
- Unabsorbed work: none; `main` is 13 commits ahead and this branch has no
  unique commits left versus `main`
- Divergence risk: low

## E. Foco Especial: Draft Inbox / Scout

### Que existe hoy de verdad

- In `feat/real-db-auth-migration`: no Draft Inbox runtime exists today.
- In `feat/internal-draft-inbox`: the following are already real repo assets:
  - internal route guard
  - inbox list page
  - draft detail page
  - approved activity page
  - `activity_drafts`
  - `internal_tool_access`
  - approval RPC
  - approved activity lifecycle RPCs
  - seed helper
  - manual smoke docs

### Que es solo documentacion o vision

- Scout Manual v0
- connector model
- sources strategy
- OCR or image-first ingestion
- upload UX
- dedupe and broader ingestion program

### Groundwork util ya presente en codigo

- Editorial landing zone exists through `activity_drafts`
- Internal access model exists through `internal_tool_access`
- Approval already targets real `public.activities`
- Approved activity lifecycle already preserves the `draft -> activity` link
- Profile surface already has an internal-entry seam on the branch that carries
  the internal tool

### Que falta para considerar que Draft Inbox MVP puede arrancar en serio

- choose one forward branch so Draft Inbox is not living on a diverged side
  line
- carry the latest active-branch fixes into that forward branch
- apply the repo-tracked SQL in Supabase
- grant one or more real internal users in `internal_tool_access`
- seed drafts
- run the Draft Inbox and approved-activity lifecycle smoke end to end
- confirm the public catalog read model reacts correctly to unpublish and
  republish

### Ready or not

- Draft Inbox itself has already started and is mostly implemented in repo on
  `feat/internal-draft-inbox`
- Draft Inbox is not ready to be treated as closed
- Scout is not ready to start as a new implementation phase
- The correct reading is:
  - Draft Inbox line is ready for consolidation and live validation
  - Scout line is still `Planned`

## F. Desalineaciones

- `main` docs are honest for `main`, but they understate the real state of the
  leading implementation branches if read as global project truth.
- `feat/internal-draft-inbox` docs and runtime say Draft Inbox is already in
  repo, while the active branch still has no internal routes at all.
- The internal branch planning docs for Scout and Draft Inbox were written
  against `feat/real-db-auth-migration`, but they only live in
  `feat/internal-draft-inbox`, so planning context and active implementation
  context are split.
- `feat/internal-draft-inbox` documents a real-catalog runtime but still misses
  the latest card-image fix; its runtime still normalizes relative `image_url`
  to `/<path>` instead of Supabase public storage.
- The viability docs originally flagged `activities.id` generation as a
  pre-implementation blocker, but the implemented SQL now contains defensive
  sequence bootstrap logic. The blocker has shifted from design uncertainty to
  live validation uncertainty.
- There was no dedicated repo doc for cross-branch status before this
  assessment, so branch-specific docs could be mistaken for repo-global state.

## G. Riesgos Y Bloqueos

- External dependency risk:
  - Supabase SQL still needs human apply and live validation
  - auth providers, redirects, and email verification still need configuration
  - Vercel internal metrics secrets still need configuration
- Branch-topology risk:
  - the two live branches are moving separately
  - `feat/real-db-auth-migration` is ahead of origin by 2 local commits
  - `feat/internal-draft-inbox` misses the latest media fix from the active
    branch
- Validation risk:
  - `package.json` still exposes no lint or test scripts
  - important flows remain manual-smoke-only
- Product/runtime risk:
  - Draft Inbox approval and approved-activity lifecycle are coded but unproven
    against the real database
  - contact-option data quality still affects real detail behavior
  - split detail architecture remains active debt
- Repo-organization risk:
  - historical branches are harmless, but the live work is split between two
    forward branches without a declared consolidation path

## H. Recomendacion

### Siguiente paso concreto

Pick one forward implementation line and consolidate on it.
The most defensible option is:

- continue from `feat/internal-draft-inbox`
- first port the latest `feat/real-db-auth-migration` deltas into it, including
  `fix(catalog): restore card image rendering`
- then validate the full SQL stack and smoke flows live

### Que conviene hacer antes de abrir una nueva etapa

- stop opening new Scout scope
- align the active migration branch and the internal editorial branch
- apply and validate:
  - `2026-04-21_real_db_auth_phase.sql`
  - `2026-04-22_internal_draft_inbox_phase1.sql`
  - `2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
- run the existing manual smoke docs in sequence
- decide explicitly whether the forward branch is the migration branch with
  Draft Inbox merged in, or the Draft Inbox branch rebased on latest migration

### Recommended next phase after that

If and only if the above closes successfully, the next logical phase is:

- Scout Manual v0

Do not jump directly to OCR, image-first ingestion, or connector breadth before
Draft Inbox is validated and absorbed into the forward branch.
