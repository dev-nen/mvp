# Tests

## Purpose

This folder stores validation artifacts for the active branch when a task needs
repeatable smoke checks or lightweight execution notes.

The goal is not to turn the repo into a heavy test-harness overnight. The goal
is to keep manual and automated validation visible, reusable, and separate from
chat history.

## What Belongs Here

- manual smoke tests
- environment-specific validation checklists
- future automated smoke scripts or harnesses
- test evidence notes when a phase depends on real external systems

## What Does Not Belong Here

- product specs
- architecture docs
- roadmap or backlog decisions
- generated build outputs

Those still belong in `docs/` or the codebase itself.

## Current Structure

- `manual/`
  - human-run smoke tests and guided checklists
- `evidence/`
  - dated notes that capture the outcome of a real smoke run

This folder can grow later with:

- `automated/`
- `fixtures/`

Only add those when they are actually needed.

## How This Repo Uses Testing Right Now

At the current maturity level of this repo, testing is a mix of:

- manual smoke checks on local or preview
- targeted build validation
- real-environment validation against Supabase and Vercel

The fastest automated snapshot for the runtime closure effort is:

```powershell
npm.cmd run report:runtime
```

It writes the latest generated evidence to:

```txt
tests/evidence/runtime-closure-latest.md
```

That `latest` file is ignored by git. Commit only dated evidence notes when a
validation result needs to become permanent project history.

That is still valid engineering work. It just needs to be documented so the
same checks can be repeated without relying on memory.

## What Codex Can Automate

Codex can help automate some smoke coverage, especially:

- opening local or preview environments in a browser
- checking that pages load
- verifying that expected UI elements appear
- checking that routes do not crash
- validating placeholder or internal-only surfaces
- exercising non-sensitive flows that do not require a personal inbox or manual
  OAuth interaction

## What Still Needs A Human

Some flows still need a human operator unless a dedicated test account and test
inbox exist:

- real Google account consent
- real email verification flows
- auth flows tied to personal accounts
- final judgment on visual or product-quality acceptance

## Rule Of Thumb

If a validation flow is likely to be repeated, give it a file in `tests/`.
