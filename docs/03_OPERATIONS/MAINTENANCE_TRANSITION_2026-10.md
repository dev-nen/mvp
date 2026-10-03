# NensGo: transition to free maintenance (October 2026)

## Current release status (October 3)

The user subsequently authorized merge, commit, push and production completion.
`main` now contains the explicit merge `733140b`; the deployment and cutover
follow-up are recorded in [the release plan](./MAINTENANCE_RELEASE_2026-10-02.md).
Live SQL and both existing administrators are provisioned, real RLS permissions
are verified, the main Deploy Hook produced a confirmed public snapshot, and
Vercel Hobby / Supabase Free are confirmed. No historical records were deleted.
Overall **Partial**: the user will disable new signups; interactive sign-in for
both administrators and the button's full session-to-deployment flow remain
unverified. The original implementation scope below is historical; its initial
production/SQL/billing exclusions were superseded by that explicit authorization.

The October 3 center-creation bug fix is tracked separately in
[its scoped plan](./MAINTENANCE_CENTER_FIX_2026-10-03.md) and
[validation evidence](./MAINTENANCE_CENTER_FIX_QA_2026-10-03.md). It persists
reviewed center fields, recovers uncertain responses without stale saves, and
keeps confirmed center bindings when reference refresh fails. It does not change
Auth, RLS, paid-service configuration or publication requirements.

## Original branch context and implementation state (October 2)

- Size: L (public routing, authentication boundaries, data and editorial flow).
- Source of truth: `feat/publisher-request-flow-phase4`; no comparison with `main`.
- Existing React/Vite/Supabase app has public catalog reads, protected detail,
  favorites, public submission flows and internal draft/publication tools.
- Pre-existing September publisher hardening changes are not part of this
  transition and must be preserved separately.
- Status: Done for local implementation, review and technical preview validation;
  overall Partial because external SQL/Auth, production rollout and actual billing
  verification remain Planned. The user authorized a push for preview on October 2.

## Goal and agreed product decisions

Keep the public service as a free proof of concept/portfolio, with occasional
manual catalog updates and at most one further year online. Keep the domain and
both existing administrators, as confirmed by the user on October 2. No new public registration, favorites, likes or
analytics. Preserve legacy private data without public use or deletion.

The attached October document supplies visual/editorial requirements; decisions
confirmed in conversation take precedence over its speculative alternatives.

## Touched files

- Public: `src/App.jsx`, Navbar, HomePage, catalog cards/detail/contact dialog,
  landing hero, AboutPage, public legal copy, ES/CA/EN locales and SEO assets.
- Administration: dedicated admin access and internal layout, draft import
  helper/page, existing draft review integration, protected center creation SQL.
- Backup: public backup service and shared data contract, build export script,
  `/api/internal/catalog-backup`, internal backup button/status, build config.
- Validation: runtime audits updated for the maintenance contract, meaningful
  import/backup/permission checks, browser smoke and operational documentation.
- Package files only for directly required scripts/dependencies.
- Review fix pack: `src/pages/InternalApprovedActivityPage.jsx` and maintenance
  SQL/tests to prevent missing age/price being normalized during approved edits.
- Deployment verification: `scripts/runtime-preview-check.mjs` and
  `docs/03_OPERATIONS/QA/MAINTENANCE_VALIDATION_2026-10-02.md`.
- Documentation: `README.md`, `docs/README.md`,
  `docs/00_START/PROJECT_BRIEF.md`, `docs/01_PRODUCT/PRODUCT_OVERVIEW.md`,
  `docs/01_PRODUCT/USER_FLOWS.md`, `docs/01_PRODUCT/ROADMAP.md`,
  `docs/02_TECHNICAL/ARCHITECTURE.md`,
  `docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`,
  `docs/02_TECHNICAL/SUPABASE_MODEL.md`,
  `docs/02_TECHNICAL/AUTH_AND_ONBOARDING.md`,
  `docs/02_TECHNICAL/ROUTES.md`, `docs/02_TECHNICAL/DEPLOYMENT_AND_ENV.md`,
  `docs/03_OPERATIONS/MAINTENANCE_RUNBOOK.md`.

## Out of scope

No legacy data deletion, organizer feature completion, new paid integrations,
search, anonymous likes, automated daily backups, automatic site shutdown,
production change or billing cancellation in this task. Repository push was
initially excluded; the user's later authorization covers this branch for preview.
No editing of the attached DOCX. No SQL is applied to the live database here.

## Risks and assumptions avoided

- An unlinked URL is not access control: keep real identity and server permission
  checks. Retire public-user writes at the DB boundary, not just the UI.
- Existing center columns/constraints must be read rather than invented.
- Never manufacture a missing year, age, price or contact from a flyer.
- Export only allowlisted public views. Include local images so a paused
  database/storage does not break the fallback. No private restore backup claim.
- Do not mark a deploy hook request as a completed backup. Verify the deployed
  manifest. Failed snapshot builds must retain the previous deployment.
- Free quotas/billing and admin identity must be verified before external rollout.

## Implementation sequence

1. Simplify public navigation/catalog/detail/contact and remove event collection.
2. Isolate current admin auth from public browsing and add reviewed JSON import
   and permission-checked center creation.
3. Add manual public snapshot generation, protected rebuild request and fallback
   catalog/contact/image reads; no scheduled jobs.
4. Update product/operational docs and run a separate read-only review.
5. Fix findings, verify locally and commit transition changes separately from
   existing publisher work. Prepare external rollout for concrete user review.

## Validation

- Static/contracts/SQL checks, import/backup tests, production build, diff checks.
- Browser: ES/CA/EN, desktop/mobile, no-session detail, category-only filtering,
  contact selection and optional name; no public account/favorite controls.
- Backup: simulated DB failure, local images/contact, invalid/missing manifests,
  failed exports; secret-safe authenticated API rejects unauthorized requests.
- Admin: review before publish, missing data remains pending, existing/new centers,
  permissions for both approved administrators and denial for other users,
  no accidental submission or analytics writes.

## Pending external rollout

The technical preview is Done; user review and production rollout remain Planned.
Confirm free plans/quotas, existing admin permission,
disable signup, apply reviewed additive maintenance SQL, set a server-only deploy
hook for the approved release branch, then deploy and validate live. Monthly
operator flow: import -> review -> publish/unpublish -> Create public backup.
The public fallback is only as current as the latest confirmed manual backup.

## Authorized preview follow-up

Branch remains `feat/publisher-request-flow-phase4`. Push commit `db49e55` only
for preview; inspect deployment metadata and verify its public copy, API denials,
languages, mobile detail/contacts and fallback in an authenticated Vercel browser
without a NensGo session. Record the evidence in this plan, the runbook and QA.
Production, live SQL/Auth, billing and the deploy hook remain outside this push.

The HTTP-only preview check encountered a Vercel authentication redirect and
reported an unhelpful `fetch failed`. This localized S follow-up changes only
`scripts/runtime-preview-check.mjs` to explain rejected redirects; it changes no
application routes, data, auth or permissions. Validate the script syntax, local
preview success and protected preview rejection, then commit and push the same
authorized branch. Do not disable deployment protection or store access tokens.

Preview `dpl_S6QBxXDVxBgCRm8xyHEZEUVfzBwZ` for `db49e55` is READY and technically
validated at https://mvp-ldjrjg3su-dibrandons-projects.vercel.app/.
It serves six activities, eight contacts and six copied images; authenticated
Vercel browser checks cover ES/CA/EN, mobile detail/contact, the actual Supabase
host outage and unauthenticated application API denial. Production aliases still
point to the previous deployment on `main` (`582b635`). User review, both real
admin sessions after provisioning and the production backup cycle remain Planned.

## Review and local closure

The separate read-only review found one data-integrity regression: the shared
editor allowed empty age/price options while the legacy approved-update RPC
silently normalized them. The fix pack adds UI and server validation before
normalization and preserves import provenance across approved edits. Regression
checks now execute the real Phase 4 approval/update/contact routines, not an
approval stub. Both existing administrators are covered.

See [validation evidence](./QA/MAINTENANCE_VALIDATION_2026-10-02.md) and the
[monthly runbook](./MAINTENANCE_RUNBOOK.md). The previous publisher hardening
work is preserved in its separate commit `5f79abc`.
