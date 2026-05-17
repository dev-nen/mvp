# AI Workflow for NensGo

## Purpose

This document defines the lightweight operating contract for AI-assisted work
in NensGo.

The goal is not to create heavy process. The goal is to prevent every task from
starting from zero, while scaling planning and validation to the actual risk of
the change.

Core rule:

```txt
Task size is defined by real risk, not by the name of the component.
```

## Roles

- Human/PO: decides product intent, priority, scope, and tradeoffs.
- ChatGPT or planning assistant: helps shape product thinking, SDDs, task
  scope, prompts, and prioritization.
- Codex or repo agent: reads the current repo, edits files, validates, and
  commits when requested by the repo rules.
- Optional second reviewer: reviews large or risky changes read-only before a
  fix pack.

One AI may help plan and another may implement, but the source of truth is
always the repo state, not chat memory.

## Source Of Truth

Use the active branch as the implementation baseline unless the user explicitly
names another branch.

The source of truth is:

- current branch;
- current repo files;
- current docs;
- `AGENTS.md`;
- real diff;
- executed validations.

Do not trust chat memory over the current repo. If historical docs conflict
with the active branch, the active branch wins.

## Task Sizes

### XS

Minimal localized change with no logic and no flow impact.

Examples:

- typo or static copy correction;
- one margin, color, or spacing tweak;
- replacing an existing icon;
- tiny config/doc correction with no behavioral impact.

Process:

```txt
direct change -> minimal validation -> status
```

Commit is optional unless the user or repo closure rules require it.

### S

Localized UI/UX adjustment or small bug fix. It may touch one component plus
directly related styles, but it must not change business rules, data, auth,
routes, Supabase, protected intent, or shared contracts.

Examples:

- move Favorites and User/Login outside the mobile navbar menu;
- adjust one card's responsive layout;
- fix a misaligned button;
- fix a visual state that renders incorrectly.

Process:

```txt
brief diagnosis -> surgical change -> validation -> commit -> no push
```

### M

Change across several files or shared logic with controlled risk. It can adjust
existing navigation, but must not change auth rules, protected routes, or
product intent without explicit scope.

Examples:

- add a simple catalog filter;
- adjust favorite state behavior across two screens without changing
  persistence;
- adjust existing navigation without changing protected intent;
- add a reusable empty state.

Process:

```txt
discovery read-only -> short plan -> implementation -> validation -> commit -> no push
```

### L

High-risk change or strong product/architecture decision. This includes data,
auth, Supabase, RLS, important routing, protected intent, central UX, backoffice,
SEO/public route posture, or architecture.

Examples:

- move favorites from one persistence model to another;
- change login, onboarding, or protected-intent behavior;
- touch `activity_view_events`, `activity_contact_events`, or Supabase
  policies;
- change main routes or routing architecture;
- redesign the primary navigation system;
- create a new public/company/detail flow.

Process:

```txt
discovery read-only -> SDD/scope -> implementation -> review read-only -> fix pack -> full validation -> commits -> no push
```

## Four Prompt Modes

### 1. DISCOVERY READ-ONLY

Use when the task is M/L, ambiguous, or touches risky contracts.

The agent reads the repo and reports current state, relevant files, risks,
proposal, and blocking questions. It does not edit, commit, or push.

### 2. IMPLEMENT

Use when scope is clear.

The agent implements only the defined scope, respects non-goals, validates, and
commits when required. It does not push.

### 3. REVIEW READ-ONLY

Use after meaningful implementation, especially for L tasks.

The agent reviews the diff or branch for bugs, regressions, missing validation,
security risk, or scope drift. It does not edit, commit, or push.

### 4. FIX PACK

Use after known findings exist.

The agent fixes only the listed findings, validates, commits, and does not
push. It must not reopen unrelated improvements.

Important principle:

```txt
Do not mix implementation and review in the same prompt unless explicitly requested.
```

## Validation Expectations

Default Windows-safe validation:

```powershell
npm.cmd run check
npm.cmd run build
git diff --check
git diff --cached --check
```

Notes:

- `npm.cmd run check` already runs the build in the current package scripts,
  but `npm.cmd run build` may still be run explicitly for clarity.
- Plain `npm run ...` can be blocked by PowerShell execution policy on Windows.
  Prefer `npm.cmd` when needed.
- For UI tasks, add manual/static checks that match the changed surface.
- For Supabase/auth/data tasks, repo checks are not enough; document any live
  validation that remains pending.

## Commit Expectations

For meaningful tasks, prefer:

```txt
Subject: short English technical summary

Context:
- Why the change exists.

Changes:
- What changed.

Validation:
- Commands/manual checks run.

Notes:
- No push performed.
- Anything intentionally out of scope or pending.
```

Tiny commits do not need excessive bodies. Commit detail should be proportional
to the task size. Longer "biblical" commit messages are useful for product,
security, data, architecture, or risky UX changes.

## When To Use Second Review

Use a read-only second review when the task is L, security-sensitive, data/auth
sensitive, or changes a central user flow. It is optional for S and most M
tasks unless the diff or risk grows.

## Anti-Patterns

Avoid:

- "fix everything";
- "make the app better";
- implementing before discovery on M/L tasks;
- classifying by sensitive words instead of real risk;
- mixing public, company, and internal flows accidentally;
- direct writes to sensitive tables without RLS/RPC review;
- exposing `service_role` or server-only secrets;
- adding public debug UI;
- translating dynamic activity, center, city, user, URL, email, or contact
  content;
- trusting chat memory over repo state;
- pushing without an explicit request.

## Human Decision Boundaries

The human decides product direction, priority, and what is acceptable to ship.

The agent may recommend scope, risks, and tradeoffs, but should not silently
promote partial work to `Done`, invent backend behavior, or close product
decisions that were not explicitly made.
