# NensGo Scout + Draft Inbox Product Plan

## Scope Note

This document is a planning artifact grounded in the current checked-out state
of `feat/real-db-auth-migration`.
Baseline checked on April 22, 2026 against the active branch working tree.
It does not implement Scout or Draft Inbox.
It refines the proposal into a repo-aligned product starting point.

## Status

- `Planned`

## Branch Context

- Active branch for this planning pass: `feat/real-db-auth-migration`
- The active branch is the source of truth for this document
- `main` is not part of this scope unless explicitly referenced later

## Inputs

- Master docs:
  - `docs/PROJECT_STATE.md`
  - `docs/ARCHITECTURE.md`
  - `docs/FEATURE_STATUS.md`
  - `docs/TECH_DEBT.md`
  - `docs/ROADMAP_IMPLEMENTATION.md`
  - `docs/SDD_WORKFLOW.md`
  - `PLANS.md`
- Related planning docs:
  - `docs/real-db-auth-migration-sdd.md`
  - `docs/supabase-schema-preview-2026-04-20.md`
- Current implementation seams:
  - `src/App.jsx`
  - `src/context/AuthContext.jsx`
  - `src/components/auth/ProtectedRoute.jsx`
  - `supabase/sql/2026-04-21_real_db_auth_phase.sql`

## Executive Summary

NensGo already has the foundations of a real product runtime in this branch:
Supabase-backed catalog reads, authenticated user flows, protected routes, and
repo-tracked SQL contracts.

What it still does not have is an internal editorial workflow that can turn
messy external activity signals into controlled, reviewable catalog candidates.

The correct first move is not auto-publication and not a broad "AI ingestion"
promise.
The correct first move is a minimal internal draft workflow where human review
is the only path to creating real catalog data.

## Problem

Today, activity growth still depends too heavily on manual one-by-one loading.
That slows down catalog expansion and causes useful local signals to be missed.

Typical source formats are operationally expensive:

- flyers and posters
- PDFs and bulletin documents
- municipal agendas
- institutional web pages
- newsletters and email
- CSV or Excel lists that are not publication-ready

Current branch reality adds one more constraint:

- the repo has no internal draft inbox
- there is no `activity_drafts` source of truth
- there is no draft-to-activity approval path
- future OCR or connectors would have nowhere safe to land

## Product Vision

### Short vision

Build an internal ingestion capability that lets NensGo receive external
activity information, convert it into drafts, and review those drafts before
publishing anything to the real catalog.

### Longer vision

NensGo Scout should not be treated as a novelty feature that "reads flyers".
It should become an editorial ingestion layer.
Its value is operational:

- detect more relevant activities
- structure raw source material faster
- reduce manual interpretation work
- preserve human quality control

If this works, NensGo stops behaving only like a manually fed catalog and
starts behaving like a platform with its own intake capability.

## Working Hypothesis

If the NensGo team can submit an external source and receive a draft that is
meaningfully faster to review than loading an activity from scratch, Scout
creates real operational value.

The first validation question is therefore:

- does the draft workflow reduce editorial effort versus fully manual load

## Initial Users

First user segment:

- internal NensGo team only

Explicitly not part of the initial phase:

- families
- public end users
- external centers
- open collaborators
- partners
- public submission channels

## Product Boundary

In this program, Scout and Draft Inbox have different responsibilities:

- `Scout` receives or reads a source and proposes a draft
- `Draft Inbox` is the internal review surface
- `Approved activity` is the only state that may create real catalog data

This distinction matters because the current branch already has a real catalog
contract.
The new work must land inside that contract, not beside it.

## MVP Principle

The first useful MVP is not broad source coverage.
The first useful MVP is:

- an internal Draft Inbox that can hold drafts safely
- human review before publication
- explicit approval that creates a real activity only when the publish contract
  can be satisfied

That means the first milestone is editorial control, not ingestion breadth.

## Functional Model

### Scout

Scout is the intake layer that receives a source and produces a structured
draft candidate.

Future source types may include:

- image
- PDF
- email
- Excel or CSV
- RSS or iCal
- webpage
- forwarded bulletin content

Expected output from Scout:

- source traceability
- extracted text
- parsed candidate fields
- confidence signal
- missing-field signal
- parsing observations

### Draft Inbox

Draft Inbox is the internal moderation layer.

Its minimum responsibilities are:

- list drafts
- open a draft
- show source traceability
- show extracted and parsed content
- let a reviewer correct publication fields
- save, approve, or reject

### Real activity

No real activity should be created until a human approves the draft.
Approval must target the real catalog data model already used by this branch.

## Lifecycle Reading

Future end-to-end lifecycle:

- source received
- extracted
- parsed
- pending review
- approved or rejected

Phase 1 lifecycle should stay smaller:

- `pending_review`
- `approved`
- `rejected`

Do not overbuild state handling before the first review loop exists.

## Non-Negotiables

- no auto-publication
- internal-only first phase
- every draft keeps origin traceability
- the current real catalog contract wins over aspirational field lists
- Scout does not create a parallel shadow catalog
- review quality matters more than ingestion volume
- the first phase must remain narrow enough to validate fast

## Primary Risks

- too many noisy drafts and too little editorial value
- overengineering before the review loop is proven
- drafts that cannot be approved because they do not resolve to real catalog
  references such as `center_id`, `category_id`, or `type_id`
- duplicated candidate activities from multiple sources
- source ambiguity around dates, age, price, or contact details

## Validation Metrics

The program should be measured by editorial usefulness, not by source count
alone.

Initial metrics:

- median review time per draft
- approval rate
- rejection rate
- number of manual field corrections per approved draft
- share of drafts blocked by unresolved references
- time saved versus fully manual creation
- share of approved activities that still need follow-up edits after publish

## Recommended Execution Order

1. Draft Inbox MVP
2. Draft data model and secure approval path
3. Scout Manual v0 that creates drafts
4. First structured connectors
5. Semistructured connectors
6. Unstructured image-first ingestion later, not first

## Closure Reading For This Planning Pass

- What changed: the proposal is now grounded in the active branch architecture
  and real catalog contract
- What stayed out of scope: implementation, OCR, connectors, upload UI, and
  auto-publication
- What remains pending: feasibility closure for approval contract details and
  time estimates
- What should happen next: use the Phase 1 SDD and viability assessment as the
  implementation entry point, not this product plan alone
