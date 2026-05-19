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

- `docs/README.md`
- `docs/00_START/PROJECT_BRIEF.md`
- `docs/02_TECHNICAL/ARCHITECTURE.md`
- `docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`
- `docs/03_OPERATIONS/AI_WORKFLOW.md`
- `docs/03_OPERATIONS/VALIDATION_CHECKLIST.md`
- `PLANS.md`

If the task affects a specific feature, also read that feature's docs in `docs/`.

## Planning Discipline

- Classify the task first with `docs/03_OPERATIONS/AI_WORKFLOW.md`.
- `XS` tasks may proceed directly after branch/context checks.
- `S` tasks require a brief diagnosis before editing: branch context, intended files,
  validation, and why the task stays `S`. They do not require the full
  `PLANS.md` template unless risk grows.
- `M` and `L` tasks require an explicit written plan before implementation.
- Treat any task touching multiple files, UX, data, auth, detail, catalog,
  favorites, profile, branding, or Supabase as potentially non-trivial; if it
  remains `S`, state why it does not change rules, routes, data, auth,
  Supabase, protected intent, or shared contracts.
- Do not start implementation from intuition alone.
- Make branch context explicit in the plan.
- Use `docs/03_OPERATIONS/AI_WORKFLOW.md` to choose task size and ceremony.

## Task Sizing

The size of a task is defined by real risk, not by the name of the component.

- `XS`: minimal localized change with no logic or flow impact.
- `S`: localized UI/UX adjustment or small bug fix that does not change rules,
  auth, data, routes, Supabase, protected intent, or shared contracts.
- `M`: several files or shared logic with controlled risk; discovery read-only
  and a short written plan are expected.
- `L`: data, auth, Supabase, RLS, important routing, protected intent, central
  UX, backoffice, SEO/public route posture, or architecture; use discovery,
  SDD/scope, implementation, read-only review, and fix pack.

Example: moving existing Favorites and User/Login buttons outside the mobile
navbar menu is `S` when it does not change auth, routes, Supabase, data,
protected intent, or favorites logic.

## AI Workflow Docs

- Workflow contract: `docs/03_OPERATIONS/AI_WORKFLOW.md`
- Prompt templates: `docs/03_OPERATIONS/DISKETNEN_TEMPLATES.md`

## Codex Tooling Lanes

- Codex app and VS Code Codex are the default surfaces for `XS` and most `S`
  work.
- Codex CLI is an optional heavier lane for `M`/`L` discovery, implementation,
  review, long-running sessions, or MCP experiments.
- CodeGraph is not part of the default workflow until explicitly piloted and
  adopted. Do not assume it is installed or configured.

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
- In the current documented baseline, favorites are remote but still require live validation.
- In the current documented baseline, Supabase is used for auth, catalog, profile,
  favorites, contact read models, product events, and internal draft contracts,
  but external SQL/Auth/Vercel readiness still gates full closure.
- Re-check the active branch before assuming those baseline facts still apply unchanged.

## Security And Product Guardrails

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or server-only secrets.
- Do not add public debug UI or raw technical errors.
- Do not show Supabase UUIDs to end users.
- Do not translate dynamic activity, center, city, user, email, URL, or contact
  values.
- Do not change auth, protected intent, favorites persistence, Supabase writes,
  or route contracts unless explicitly in scope.

## Closure

Every closed task should leave clear:

- what changed
- what stayed out of scope
- what remains pending
- what was validated
- final git status

Before ending a task, inspect `git status`. If the agent made any follow-up
change during the task, stage and commit it as part of that task unless the
user explicitly asked not to commit. Do not leave agent-made changes staged or
unstaged for a future task.
