# DISKETNEN Templates

These templates are reusable prompts for NensGo. Pick the smallest mode that
matches the task risk. Do not paste every section if a task is XS/S and the
context is already clear.

Tooling lane:

- Use Codex app or VS Code Codex for `XS` and most `S` tasks.
- Use Codex CLI when `M`/`L` work benefits from terminal context, long-running
  discovery, review, command validation, or MCP checks.
- Each task may declare:

```txt
TASK SIZE: XS | S | M | L
TOOLING LANE: Codex app | VS Code Codex | Codex CLI
CODEGRAPH: true | false
```

- Use `CODEGRAPH: false` for `XS` and most `S` tasks.
- Evaluate `CODEGRAPH: true` for `M`; prefer it for `L` discovery/review when
  available.
- Humans decide `CODEGRAPH: true` or `CODEGRAPH: false` during task
  classification. Codex must not assume CodeGraph for every task.
- When CodeGraph is used, treat it as a read-only first pass. Verify important
  findings by reading files directly before planning, editing, or reporting.

## DISCOVERY READ-ONLY

```txt
DISKETNEN [M/L] - DISCOVERY READ-ONLY - [TASK NAME]

TASK SIZE: XS | S | M | L
TOOLING LANE: Codex app | VS Code Codex | Codex CLI
CODEGRAPH: true | false

MODE
Read-only discovery.
Do not edit files.
Do not commit.
Do not push.

BRANCH CONTEXT
Use the branch explicitly specified here: [branch], or the current checked-out
branch if none is specified.
Use main only as a comparison baseline if this prompt explicitly says so.

OBJECTIVE
[Describe the product/technical problem.]

CURRENT CONTEXT
[Known facts from the user. Mark uncertainty clearly.]

REQUIRED READING
- AGENTS.md
- docs/README.md
- docs/00_START/PROJECT_BRIEF.md
- docs/02_TECHNICAL/ARCHITECTURE.md
- docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md
- docs/03_OPERATIONS/AI_WORKFLOW.md
- docs/03_OPERATIONS/VALIDATION_CHECKLIST.md
- [feature-specific docs]

CODEGRAPH
If CODEGRAPH: true:
- Confirm CodeGraph availability with `codegraph_status`.
- Use CodeGraph as a read-only first pass only.
- Prefer the current/default project context.
- Do not pass explicit `projectPath` unless necessary.
- Verify key findings by reading files directly.

QUESTIONS TO ANSWER
- What is true today in the active branch?
- Which files/contracts are relevant?
- What are the risks?
- What should be in scope?
- What should stay out of scope?
- Are there blocking questions?
- What validation would prove the task?

OUTPUT FORMAT
- Branch context
- Current state
- Relevant files
- Risks
- Proposed scope
- Non-goals
- Blocking questions
- Suggested validation
```

## IMPLEMENT

```txt
DISKETNEN [XS/S/M/L] - IMPLEMENT - [TASK NAME]

TASK SIZE: XS | S | M | L
TOOLING LANE: Codex app | VS Code Codex | Codex CLI
CODEGRAPH: true | false

MODE
Implementation task.
Use the task size process from docs/03_OPERATIONS/AI_WORKFLOW.md.
Do not refactor unrelated code.
Do not push.

FIRST
- Confirm current branch and git status.
- For `S`, provide brief diagnosis, intended files, validation, and why it
  stays `S`.
- For `M`/`L`, provide the required written plan before editing.
- If CODEGRAPH: true, CodeGraph may be used before editing to identify
  candidate files and impact. Do not edit solely from CodeGraph output. Read
  the actual files before changing them.

OBJECTIVE
[What must change.]

SCOPE
[Files/areas likely in scope.]

NON-GOALS
Do not change:
- [explicit non-goal]
- [explicit non-goal]

IMPLEMENTATION RULES
- Reuse existing local patterns.
- Preserve existing behavior outside the stated scope.
- Do not duplicate business logic.
- Do not add public debug UI.
- Do not expose server-only secrets.

SECURITY RULES
- Do not expose `SUPABASE_SERVICE_ROLE_KEY`.
- Do not introduce client-side writes to sensitive tables without RLS/RPC review.
- Do not show Supabase UUIDs or raw technical errors to end users.

I18N / CONTENT RULES
- Translate static UI only when needed.
- Do not translate dynamic activity, center, city, user, email, URL, or contact
  values.

VALIDATION
Run:
npm.cmd run check
npm.cmd run build
git diff --check
git diff --cached --check

Manual/static checks:
- [task-specific check]
- [task-specific check]

COMMIT
Commit after validation.
Do not push.

Suggested subject:
[Short English technical summary]

EXPECTED OUTPUT
- Files changed
- What changed
- What stayed out of scope
- What remains pending
- Validation results
- Commit hash
- Final git status
- No push confirmation
```
## REVIEW READ-ONLY

```txt
DISKETNEN [M/L] - REVIEW READ-ONLY - [TASK NAME]

TASK SIZE: XS | S | M | L
TOOLING LANE: Codex app | VS Code Codex | Codex CLI
CODEGRAPH: true | false

MODE
Review only.
Do not edit files.
Do not commit.
Do not push.

BRANCH / DIFF TO REVIEW
[Current branch, target branch, PR, or git diff range.]

OBJECTIVE
Review whether the implementation satisfies:
- [goal]
- [goal]

REVIEW FOCUS
- correctness and regressions;
- scope drift;
- missing validation;
- auth/data/Supabase/security risk if relevant;
- UI/UX regressions if relevant;
- stale docs or status language.

CODEGRAPH
If CODEGRAPH: true:
- Use CodeGraph to check related symbols, imports, callers, or impact where
  useful.
- Verify findings directly in files.
- Report CodeGraph limitations if they affect confidence.

SEVERITY LEVELS
P0 - blocking correctness/security/data-loss issue.
P1 - high-risk regression or broken promised behavior.
P2 - important issue that should be fixed before merge.
P3 - minor issue, cleanup, or follow-up.

OUTPUT FORMAT
- Findings first, ordered by severity
- File/line references where possible
- Open questions
- Residual risk or missing validation
- Short summary
```

## FIX PACK

```txt
DISKETNEN [S/M/L] - FIX PACK - [TASK NAME]

TASK SIZE: XS | S | M | L
TOOLING LANE: Codex app | VS Code Codex | Codex CLI
CODEGRAPH: false

MODE
Fix only known findings.
Do not broaden scope.
Do not push.

CODEGRAPH
CODEGRAPH: false by default. Set CODEGRAPH: true only if the known finding
requires tracing shared logic or impact.

KNOWN FINDINGS
1. [Finding id/severity/title]
2. [Finding id/severity/title]

EXACT FILES / AREAS
- [path or area]
- [path or area]

RULES
- Fix only the listed issues.
- Preserve unrelated changes.
- Do not refactor unrelated code.
- Do not reopen product decisions.

VALIDATION
Run:
npm.cmd run check
npm.cmd run build
git diff --check
git diff --cached --check

Manual/static checks:
- [check tied to finding]
- [check tied to finding]

COMMIT
Commit after validation.
Do not push.

EXPECTED OUTPUT
- Findings fixed
- Files changed
- Validation results
- Commit hash
- Final git status
- No push confirmation
```
