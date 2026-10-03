# Center creation fix: validation on October 3, 2026

Status: Done for implementation, independent review and local validation;
release In progress. Branch: `main`, starting revision `b133cf4`.
Scope and decisions: [implementation plan](./MAINTENANCE_CENTER_FIX_2026-10-03.md).

## Confirmed diagnosis

- Real maintenance SQL in PGlite reproduces the previous failure: successful
  center binding, failed client reload, stale pre-save deleting that binding,
  duplicate rejection on retry. The corrected recovery keeps the binding.
- A read-only, verified-TLS production query found no Dancing Queens center and
  one pending proposed-center draft. Its reviewed organizer and postal code are
  absent. No production records were modified or published in this task.
- Live municipality searches return Vilanova i la Geltrú with and without
  accents. Typing a search does not constitute selecting a municipality.

## Automated checks

`npm.cmd run check` passed after the implementation and review fix pack:

- 9 static and 17 runtime-contract checks, contact messages in ES/CA/EN.
- Real Phase 4 lifecycle SQL and maintenance permissions, both administrators,
  denied outsiders, atomic center creation and safe retries, unknown values,
  imports, contact publication and absence of unintended publication.
- Backup export/fallback, image safety, authorization and pending confirmation.
- New center coordinator regression: stale retries, lost/late RPC responses,
  blocked uncertain outcomes, revision conflicts before/during writes, read-only
  recovery, positive ID guards, safe domain errors, selected-reference round trips
  and preserved missing age/price facts.
- A failed initial draft read is distinguished from an attempted uncertain RPC:
  retry still saves unsaved activity edits in the first case. Uncertain RPC retry
  only invokes the atomic RPC and never overwrites newer reviewed activity data.
- Production build includes 6 public activities, 8 contacts and 6 copied images.
  The existing large Markdown-editor chunk warning remains; no dependency added.

## Browser validation

Local fixture harness mounts the real detail page, panel, services, mappings and
coordinator. Only the Supabase client is replaced with an in-memory fixture;
external requests are blocked. This is not an authenticated production session.

Thirteen functional scenarios pass: required fields and explicit municipality,
new/existing organizer persistence after save and reload, synchronous write lock
and double click, optional center-list reload failure, lost RPC response,
uncertain read failure and atomic retry, SQL rejection and correction, conflicts
before/during CAS and normal saving, confirmed ID with failed authoritative read
and protected read-only reload. Runtime/console errors: zero; external requests:
zero. The initial-read failure with an unsaved title preserves the title on retry
with one save before creation. Mobile viewport and document both measure 390px
(previously the document overflowed to 495px). Desktop and mobile screenshots
were inspected; fields and recovery controls are readable.

Temporary fixture evidence: `nensgo-center-browser-fixture/verify-browser.mjs`,
`uncertain-center-mobile.png`, `saved-center-desktop.png` and
`creating-center-desktop.png` in the host's temporary directory. No fixture,
identity, token or debug route is included in the deployed application.

## Independent review

Read-only review identified stale loaded revisions, RPCs that may finish after a
failed response, and optimistic revisions after creation. Fixes compare the
loaded revision, distinguish confirmed SQL rejection from transport uncertainty,
retain the confirmed pre-save revision, retry uncertain RPCs without pre-saving,
and require authoritative reads before further writes. The read-only reload
button catches failures and preserves its lock. Final read-only review: PASS,
no actionable findings remaining. It does not claim a live administrator session.

## Release and limits

Remote preview, push, production readiness and exact deployed commit: Planned.
The administrator must supply real missing facts, confirm the center and review
before publication. No fake center, user authentication token, production draft
write or automatic publication was used for validation. Auth signup closure and
the original backup-button session verification remain separate release items.
