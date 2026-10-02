# NensGo: transition to free maintenance (October 2026)

## Branch context and current state

- Size: L (public routing, authentication boundaries, data and editorial flow).
- Source of truth: `feat/publisher-request-flow-phase4`; no comparison with `main`.
- Existing React/Vite/Supabase app has public catalog reads, protected detail,
  favorites, public submission flows and internal draft/publication tools.
- Pre-existing September publisher hardening changes are not part of this
  transition and must be preserved separately.
- Status: Done for local implementation and review; overall Partial because
  external SQL/Auth/deployment and actual billing verification remain Planned.

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
repository push, production change or billing cancellation in this local task.
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

Review preview first. Confirm free plans/quotas, existing admin permission,
disable signup, apply reviewed additive maintenance SQL, set a server-only deploy
hook for the approved release branch, then deploy and validate live. Monthly
operator flow: import -> review -> publish/unpublish -> Create public backup.
The public fallback is only as current as the latest confirmed manual backup.

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
