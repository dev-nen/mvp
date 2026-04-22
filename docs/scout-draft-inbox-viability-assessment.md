# Scout + Draft Inbox Viability Assessment

## Scope Note

This document is a feasibility and estimation artifact grounded in the current
checked-out state of `feat/real-db-auth-migration`.
Baseline checked on April 22, 2026 against the active branch working tree.
It does not implement Scout or Draft Inbox.
It evaluates whether the proposal is a defensible next phase in this repo and
how much time the first slices are likely to need.

## Status

- `Planned`

## Branch Context

- Active branch for this assessment: `feat/real-db-auth-migration`
- The active branch is the source of truth for this evaluation
- `main` is not part of this scope unless explicitly referenced later

## Assessment Summary

High-level reading:

- Draft Inbox Phase 1 is viable in the current repo
- Scout Manual v0 is viable after Draft Inbox exists
- broad OCR or image-first ingestion is not the right first implementation slice

Implementation readiness for the overall program is still `Partial`, not
`Ready`, because a few publish-contract details remain unconfirmed.

## Why This Is Viable In This Branch

The current branch already provides several conditions that make this proposal a
real fit instead of a detached side project:

- authenticated and protected routes already exist
- app-user identity already lives in `public.user_profiles`
- Supabase is already the active product runtime for catalog and auth
- SQL changes are already versioned in-repo under `supabase/sql/`
- the catalog already has a real publish target through `public.activities`
- the codebase already has a natural feature seam under `src/features/`

Practical reading:

- Draft Inbox can live inside the main repo without inventing a new platform
- approval can target the same data model the public app already uses
- the repo already has the right shape for a first internal tool

## Main Readiness Gaps

| Dependency | Status | Why it matters | Effect on scope |
| --- | --- | --- | --- |
| Internal reviewer authorization model | `Partial` | There is no current internal-tool access layer | Add `internal_tool_access` or equivalent RLS-backed gate |
| Draft source-of-truth table | `Partial` | There is no editorial draft model today | Add `activity_drafts` before any Scout work |
| Activity publish contract from approval | `Partial` | Real `activities` rows require normalized references and mandatory fields | Approval UI must collect publish-ready fields, not just human labels |
| `activities.id` generation confirmation | `Blocked` | Repo-only evidence does not prove the final insert contract | Confirm before authoring the approval RPC |
| Contact publication decision | `Partial` | Current detail contract uses `activity_contact_options` | Decide whether Phase 1 approval creates only `activities` or also contact rows |
| Existing center resolution strategy | `Partial` | Approval cannot rely on `center_name` text alone | Restrict Phase 1 to existing centers or expand scope deliberately |
| Automated regression tooling | `Blocked` | There are no test or lint scripts in `package.json` | Budget for mostly manual validation |
| Upload and storage strategy | `Planned` | Scout Manual v0 needs file or URL storage decisions | Not required for Draft Inbox Phase 1 |

## Main Refinement Versus The Original Proposal

The original idea is directionally strong, but one assumption needs to be
corrected before implementation:

- approving a draft cannot be based on `title + city + category + contact`

In the current schema, approval must satisfy real publish requirements such as:

- `center_id`
- `category_id`
- `type_id`
- `description`
- `image_url`
- `age_rule_type`
- `schedule_label`

This is the biggest reason Draft Inbox should come before Scout breadth:

- the publish contract must be made explicit first
- otherwise ingestion will create drafts that cannot be approved safely

## Viability By Phase

| Phase | Viability | Reading |
| --- | --- | --- |
| Draft Inbox Phase 1 | Strong | Narrow internal workflow with approval is a good fit for the current branch |
| Scout Manual v0 | Good after Phase 1 | Manual draft creation is sensible once the landing zone exists |
| First structured connectors | Good after Manual v0 | Reusable, lower-risk connectors are the right first automation step |
| Semistructured connectors | Moderate | Valuable, but parsing ambiguity rises quickly |
| Unstructured image-first connectors | Low for first release | Highest uncertainty and easiest place to overbuild too early |

## Recommended Scope Boundary To Keep Viability High

Recommended Phase 1 scope:

- internal-only Draft Inbox
- seed drafts
- human review
- approve into `activities`
- no upload UI
- no OCR
- no dedupe
- no center creation flow

Recommended Phase 1 constraint:

- approval only for drafts that can be resolved against existing catalog
  references

This keeps the first slice narrow enough to validate the editorial workflow
without pretending the entire ingestion program is solved.

## Effort Estimates

Assumptions behind all estimates:

- one engineer
- active branch remains the implementation baseline
- normal review and product feedback loop
- no major external blocker besides the already known dependency checks
- estimates are engineering effort, not guaranteed elapsed time

### Recommended estimates by slice

| Scope slice | Effort estimate | Calendar reading | Notes |
| --- | --- | --- | --- |
| Approval-contract preflight and final spec closure | `0.5 to 1.5 days` | `1 to 2 working days` | Confirm `activities` insert contract, id generation, and contact decision |
| Draft Inbox Phase 1 MVP | `4 to 6 days` | `1 to 1.5 weeks` | Assumes existing centers only, no upload UI, no contact-option insert |
| Draft Inbox Phase 1 plus contact-option creation on approval | `6 to 8 days` total | `1.5 to 2 weeks` | Adds multi-table approval complexity |
| Draft Inbox Phase 1 plus center creation or resolution workflow | `8 to 10+ days` total | `2+ weeks` | Not recommended for the first slice |
| Scout Manual v0 on top of Draft Inbox | `3 to 5 days` | `0.5 to 1 week` | Manual draft creation from text, URL, or stored file reference without OCR |
| First structured connector | `2 to 4 days` each | `0.5 to 1 week` each | Best candidates are CSV/XLSX or RSS/iCal |
| First semistructured connector | `4 to 7 days` each | `1 to 1.5 weeks` each | PDF or irregular webpage parsing increases cleanup burden |
| First unstructured image connector | `6 to 10 days` each | `1.5 to 2+ weeks` each | OCR and extraction confidence drive the uncertainty |

### Program-level reading

Most defensible first milestone:

- Draft Inbox Phase 1 only: about `1 week` of focused work after preflight

Most defensible first end-to-end validation:

- Draft Inbox Phase 1
- Scout Manual v0
- one structured connector

That combined path is roughly:

- `2 to 3.5 weeks` of engineering effort in a realistic sequence

Not recommended for the first validation window:

- Draft Inbox
- upload UI
- OCR
- flyer ingestion
- duplicate detection
- center creation
- contact-option publication
- multiple connectors

Bundling all of that together would likely push the initial slice into a
`4 to 6+ week` effort with much weaker learning quality.

## Go / No-Go Reading

`Go` for Phase 1 if the team accepts these conditions:

- internal-only first
- approval restricted to publish-ready drafts
- existing centers, categories, and types are the first reference set
- no OCR and no connector breadth in the same slice

`No-go` for a single first slice if the expectation is:

- broad source coverage immediately
- autonomous publication
- missing-center creation in the same phase
- image-first ingestion as the primary MVP

## Recommended Next Step

If the product decision is to proceed, the next implementation contract should
be:

- `docs/scout-draft-inbox-phase1-sdd.md`

That is the right entry point because it keeps the first build phase aligned to
the real branch contract, the real schema constraints, and a realistic effort
envelope.
