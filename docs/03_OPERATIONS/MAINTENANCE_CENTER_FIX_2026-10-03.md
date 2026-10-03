# Maintenance center creation recovery

## Branch context

- Status: Done for implementation, independent review, validation and release.
  Size: L (backoffice persistence and shared draft contracts).
- Active implementation branch: `main`, starting at `b133cf4`.
- This continues the authorized maintenance release, including commit, push and production verification.
- CodeGraph is unavailable in this session; discovery used direct source reads, real SQL in PGlite and read-only production queries.

## Current state

- Center creation and draft binding are atomic in the protected maintenance RPC.
- The client ignores the returned center ID. A failed subsequent reload leaves stale `proposed_new` state; retry saves that stale state, deletes the binding and receives a duplicate error. Reproduced with the real migration in PGlite.
- Center-panel fields are local state and are lost when the draft is saved or refreshed. Parent writes remain enabled during creation.
- Municipality search works live, including Vilanova i la Geltrú; typing a name does not confirm a municipality. The supplied screenshot also has missing entity name, postal code and explicit confirmation.

## Goal

- Persist all reviewed center fields and explicit reference selections in the draft.
- Retain successful creation immediately and recover an uncertain response before any further write.
- Block conflicting editor actions during creation/recovery and explain required fields, search state and failed requests.
- Keep creation separate from publication, without inventing missing facts.

## Touched files

- `src/features/scout-drafts/MaintenanceCenterCreatePanel.jsx`
- `src/features/scout-drafts/MaintenanceCenterCreatePanel.css` (scoped fieldset layout)
- `src/pages/InternalDraftDetailPage.jsx`
- `src/pages/InternalDraftDetailPage.css` (contain the reviewed form on mobile)
- `src/services/maintenanceAdminService.js`
- `src/services/internalDraftsService.js` (optional revision precondition for the pre-creation save)
- `src/helpers/maintenanceCenterCreation.js` (pure, dependency-injected recovery coordinator)
- `src/helpers/mapDraftPayloadToFormState.js`
- `src/helpers/mapFormStateToDraftPayload.js`
- `src/helpers/internalDraftCreateAutosave.js`
- `scripts/maintenance-admin-check.mjs` and `scripts/maintenance-center-flow-check.mjs`
- `package.json` (include regression verification in check)
- This plan, `docs/03_OPERATIONS/MAINTENANCE_CENTER_FIX_QA_2026-10-03.md` and `docs/03_OPERATIONS/MAINTENANCE_TRANSITION_2026-10.md`.
- `docs/03_OPERATIONS/MAINTENANCE_RUNBOOK.md` (persisting proposals and safe retry/reload steps).

## Out of scope

- No SQL/schema/auth/RLS changes, account changes, paid services or historical-data deletion.
- No automatic creation of real centers or publication of the user's draft; missing facts remain pending.
- The user attachment remains untracked and untouched.

## Risks

- A lost RPC response may hide a successful transaction. Read the authoritative draft first on every attempt and after a failure; if that read fails, require recovery and block other writes.
- Another administrator may change the draft. Require its read revision for the pre-creation save, and stop on conflict.
- An uncertain retry must not save an old form again: reconcile first and retry only the atomic center RPC, preserving current server edits.
- Apply the confirmed ID immediately, then read the authoritative revision. If that read fails, retain the binding and require a read-only reload before other writes.
- Optional reference-list reload failure must not convert confirmed creation into a creation failure or erase the binding.
- Restored municipality/institution IDs must remain explicit selections, with real labels; a partial search must never select a municipality automatically.

## Assumptions avoided

- Do not infer organizer identity, municipality, postal code, dates, price or age.
- Repo checks are not proof of an authenticated production interaction.
- The existing production draft will be inspected read-only, without overwriting it.

## Implementation sequence

1. Implement and test recoverable creation, conditional save, and payload round trips.
2. Control panel inputs through draft state; show missing fields and municipality progress.
3. Coordinate the parent write lock; apply the returned binding before optional list refresh.
4. Perform independent read-only review, fix findings, and run the full checks and browser fixture flows.
5. Commit scoped changes, push and verify the deployed commit. Document evidence and any live-session limits.

## Validation

- Real SQL regression: create/link, failed refresh, safe retry, no duplicates or lost links, no activity publication.
- Coordinator regression: response loss, recovery read failure, save conflict, pending-status guards, retry without stale writes.
- Payload/autosave round trips preserve explicit city/entity IDs and unknown fields stay unknown.
- Local browser: required fields, municipality search/selection, saved form restoration, locked parent actions, confirmed creation and uncertain-response recovery. Fixture identities/data only.
- `npm.cmd run check`, `git diff --check`, read-only review and final Git status.
- Production read-only readiness and deployed commit; interactive production-admin testing is reported separately if unavailable.

## Pending after closure

- Runtime commit `751524c` is deployed in production after successful remote
  preview; detailed evidence is in [the validation record](./MAINTENANCE_CENTER_FIX_QA_2026-10-03.md).

- The administrator supplies real missing information and explicitly publishes after review.
- Existing user-owned records are preserved; no duplicate cleanup is implicit in this fix.
