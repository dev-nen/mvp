# SDD Workflow

## Goal

Use the repo as a living source of truth so future work starts from documented current state, not from chat memory alone.

This repo is not using a rigid formal SDD framework, but it should work with a spec-driven discipline:

current state -> spec -> plan -> implementation -> validation -> documentation update

## What Starts A Task

A task can start from:

- a disket-style brief
- a product request
- a bug report
- a debt-reduction task
- a documentation correction

The incoming brief is only the starting contract. It must be grounded in the current repo before implementation begins.

## Required Sequence For Non-Trivial Work

1. Confirm branch context: use the branch explicitly specified by the user, or the current checked-out branch if none is specified.
2. Ground in the present repo state of that active branch.
3. Read the relevant master docs before touching code.
4. Read any feature-level docs that cover the affected contract.
5. Translate the task into an explicit spec or implementation brief tied to current repo reality.
6. Produce a plan before editing when the task is non-trivial.
7. Implement only within the approved scope.
8. Validate the result.
9. Update documentation and closure notes so the repo remembers what changed.

## How The Repo Should Be Read

Start with:

- `docs/PROJECT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURE_STATUS.md`
- `docs/TECH_DEBT.md`
- `docs/ROADMAP_IMPLEMENTATION.md`
- `PLANS.md`

Then read feature-level docs only for the surfaces or contracts the task actually touches.

## How A Brief Becomes A Spec

A useful spec for this repo should state:

- branch context
- current state in the active branch
- goal of the task
- in-scope and out-of-scope behavior
- touched files
- constraints and non-negotiables
- risks and assumptions avoided
- validation method

If a task arrives through a disket or Disket Standard v2 brief, that brief should become the implementation contract only after it is checked against the current repo.

## Artifact Types

This repo can use multiple artifact types during a non-trivial task. Their
purposes should stay explicit:

- `External Snapshot`
  - captures evidence about a system outside the repo
  - useful for schema, RLS, grants, OAuth config, env setup, or external APIs
  - does not decide product behavior by itself
- `Spec / SDD`
  - translates the task into the working contract for the phase
  - grounded in the active branch and any confirmed external evidence
  - should separate current state, goal, scope, risks, and validation
- `Open Decisions`
  - lists unresolved product or technical choices that still affect the work
  - should present options clearly and may include a recommendation
- `Closed Decisions`
  - records the resolved choices that the next planning phase can rely on
  - should point back to the decisions it closes
- `Implementation Plan`
  - defines the concrete execution sequence once spec and key decisions are
    ready
  - should state touched files, risks, out-of-scope items, and validation
- `Closure Note`
  - closes an implemented phase
  - should leave clear what changed, what did not change, what remains pending,
    and what was validated

One artifact should not try to do multiple jobs at once if that makes its role
ambiguous.

## Dependency Readiness Gate

Before planning implementation for work that depends on external systems, check
whether those dependencies are actually ready enough for the phase.

This matters especially for:

- Supabase schema
- RLS and grants
- auth provider setup
- Vercel environment configuration
- external contracts or APIs

The readiness check should make visible:

- which external dependency matters
- what evidence exists
- what is still unconfirmed
- whether the dependency is `Ready`, `Partial`, or `Blocked`

If a critical dependency is still `Blocked`, do not present implementation as
fully ready to start. In that case, the correct output is usually one of:

- an external snapshot
- a spec / SDD
- an open-decisions artifact
- a conditional or partial plan

Do not treat product intent alone as proof that an external dependency is
resolved.

## Decision Promotion Rule

When a decision moves from open to closed, the repo should reflect that
promotion explicitly.

At minimum, promoting a decision should do all of the following:

- record the closure in a `Closed Decisions` artifact or equivalent
- update the affected `Spec / SDD`
- update `DECISIONS_LOG.md` if the decision is now stable for future work
- leave clear traceability from the open-decisions artifact to the document that
  resolves it

Do not treat a decision as promoted only because it was stated in chat.

Master docs must not be updated just because a decision was closed; they should
only be updated when the active branch actually reflects that new product or
architecture state.

Closing a decision does not close a feature. A decision can be closed while the
implementation still remains `Planned` or `In progress`.

## Plan Mode Expectations

Use explicit planning first when the task:

- touches more than one file
- affects UX or visible behavior
- changes data flow or contracts
- touches auth, profile, favorites, detail, catalog, branding, or Supabase-related flows
- has any meaningful risk of scope drift

The plan should make no hidden decisions. It should lock:

- which branch is the active implementation baseline
- what is true today
- what will change
- what will not change
- how success will be checked

## Implementation Rules

- The current checked-out branch is the default source of truth unless the user explicitly says otherwise.
- Current code and current master docs for that branch context are the primary source of truth.
- Commits are historical support only.
- Use `main` as a comparison or reference baseline only when the task explicitly requires it.
- Do not document or implement future phases as if they already exist.
- Do not treat partial work as done because a branch or commit message used strong language.
- Keep present state, next phase, and later roadmap clearly separate.
- Respect touched-file scope.

## Validation Rules

Validation should be explicit and scoped to the task:

- confirm touched files
- check behavior or outputs that were meant to change
- list what was not validated if something could not be run
- call out remaining debt or follow-up work

## Generated Artifact Rule

Generated build outputs are validation artifacts unless the user explicitly asks
to version them.

- Do not commit generated frontend build outputs such as `dist/` by default.
- If build validation changes tracked generated files, restore or remove those
  artifact changes before commit.
- If build validation creates new generated files, remove them after validation
  unless the user explicitly asked to keep them.
- Keep the working tree clean of generated artifact noise once validation is
  finished.

## Commit Cadence Rule

Commits should be small, reviewable checkpoints rather than large mixed dumps.

- Prefer one commit per coherent slice such as a component, a contract boundary,
  a data-layer change, or a docs update.
- Commit once that slice is locally stable or otherwise meaningfully validated.
- If a task spans multiple layers, split the work into multiple commits by
  responsibility instead of waiting for one large final dump.
- Do not hold thousands of insertions in one commit when smaller checkpoints
  already stand on their own.

## Documentation Update Rule

After non-trivial work, update the docs that changed materially:

- current state if the baseline moved
- architecture if flow or boundaries changed
- feature status if a line moved from planned to partial or done
- roadmap if priorities changed
- debt if a gap was introduced or removed

## Closure Rule

A task is not fully closed until the repo makes it clear:

- what changed
- what did not change
- what remains pending
- what was validated
