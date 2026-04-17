# Plans

## When To Use This

Use this structure for any long-running or non-trivial implementation task.

## Plan Rules

- Base the plan on the branch explicitly specified by the user.
- If the user does not specify a branch, base the plan on the branch currently checked out in git.
- Do not assume `main` is always the active implementation branch.
- Use `main` as a comparison baseline only when the task explicitly requires it.
- Separate current state, target change, and later roadmap.
- Name touched files explicitly.
- Name out-of-scope files or systems explicitly.
- Surface risks and assumptions avoided before implementation starts.
- Define validation before implementation starts.
- If a file outside the expected scope becomes necessary, declare that in the plan first.

## Required Sections

Every substantial plan should include:

1. What is true today
2. Goal
3. Touched files
4. Out of scope
5. Risks
6. Assumptions avoided
7. Implementation sequence
8. Validation
9. Pending follow-up if any

## Reusable Template

```md
# Task title

## Branch context

- Active branch for this task
- Whether `main` is only a reference baseline or also part of the task scope

## Current state

- What is already true in the active branch
- Relevant docs or contracts already in the repo for that branch context
- Any partial implementation already present in the active branch

## Goal

- What this task will change
- What success looks like

## Touched files

- `path/to/file`

## Out of scope

- Files or systems that must not change
- Future phases that are not part of this task

## Risks

- Real implementation or product risks

## Assumptions avoided

- Facts that must be confirmed in code/docs rather than guessed

## Implementation sequence

1. Step one
2. Step two
3. Step three

## Validation

- Command checks
- Manual checks
- What cannot be validated here, if anything

## Pending after closure

- Remaining debt
- Follow-up tasks
```

## Notes

- A good plan is decision-complete. The implementer should not need to guess the next step.
- Do not write plans that treat partial work as already done.
- Do not hide roadmap work inside the current implementation scope.
- If the task needs `main`, say so explicitly instead of treating it as the automatic baseline.
