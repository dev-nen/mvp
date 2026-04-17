# AGENTS

## Baseline

- Work from the branch explicitly specified by the user.
- If the user does not specify a branch, work from the branch currently checked out in git.
- Do not assume `main` is always the active implementation branch.
- Use `main` only as a reference baseline when the task explicitly requires comparison against it.

## Source of truth

- The current checked-out branch is the default source of truth for implementation work, unless the user explicitly says otherwise.
- Current code and current master docs are the source of truth for that branch context.
- If history conflicts with the present repo state of the active branch, the present repo state of the active branch wins.
- If the task requires documenting or comparing `main`, that scope must be stated explicitly.

## Read Before Touching Code

First verify branch context:

- use the branch explicitly specified by the user
- if none is specified, use the branch currently checked out in git
- if comparison against `main` matters, state that explicitly before planning or implementing

Read at minimum:

- `docs/DOCS_INDEX.md`
- `docs/PROJECT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP_IMPLEMENTATION.md`
- `docs/FEATURE_STATUS.md`
- `docs/TECH_DEBT.md`
- `PLANS.md`

If the task affects a specific feature, also read that feature's docs in `docs/`.

## Planning Discipline

- Use Plan Mode or an explicit written plan for non-trivial work.
- Treat any task touching multiple files, UX, data, auth, detail, catalog, favorites, profile, branding, or Supabase as non-trivial.
- Do not start implementation from intuition alone.
- Make branch context explicit in the plan.

## Scope Rules

- Respect touched files exactly.
- Do not expand scope with opportunistic cleanup.
- Do not reopen closed product decisions unless the task explicitly asks for it.
- Do not invent data, backend behavior, or completion states.

## Status Language

Use these labels precisely:

- `Done`
- `In progress`
- `Partial`
- `Planned`
- `Blocked`

Do not describe partial areas as closed, final, fully complete, or production-ready without evidence in the current repo.

## Project-Specific Guardrails

- In the current documented baseline, detail is partial and split across Home modal and Favorites detail page.
- In the current documented baseline, auth base is already implemented, but still depends on external Supabase and Google OAuth configuration.
- In the current documented baseline, favorites are still local to the browser.
- In the current documented baseline, Supabase is used for auth and `activity_events`, not as the full product backend.
- Re-check the active branch before assuming those baseline facts still apply unchanged.

## Closure

Every closed task should leave clear:

- what changed
- what stayed out of scope
- what remains pending
- what was validated
