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
