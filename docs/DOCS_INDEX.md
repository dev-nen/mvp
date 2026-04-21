# Documentation Index

## Purpose

This repo now uses two documentation layers:

- Master docs for current state, architecture, roadmap, debt, feature status, and working rules.
- Feature-level reference docs for narrower contracts already documented in past stories.

The master docs describe the documented baseline of the branch context they were written against. Check each document's scope note before assuming it describes `main`. Feature-level docs can preserve more historical or story-specific context, but they do not override the current repository state of the active branch.

## Recommended Reading Order

1. [PROJECT_STATE.md](./PROJECT_STATE.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [FEATURE_STATUS.md](./FEATURE_STATUS.md)
4. [TECH_DEBT.md](./TECH_DEBT.md)
5. [ROADMAP_IMPLEMENTATION.md](./ROADMAP_IMPLEMENTATION.md)
6. [DECISIONS_LOG.md](./DECISIONS_LOG.md)
7. [SDD_WORKFLOW.md](./SDD_WORKFLOW.md)
8. [../PLANS.md](../PLANS.md)
9. [../AGENTS.md](../AGENTS.md)
10. [../tests/README.md](../tests/README.md)

## Master Docs

| Document | What it is for |
| --- | --- |
| [PROJECT_STATE.md](./PROJECT_STATE.md) | Current product and implementation snapshot. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current frontend architecture, data flow, auth flow, and Supabase role. |
| [ROADMAP_IMPLEMENTATION.md](./ROADMAP_IMPLEMENTATION.md) | Internal implementation roadmap split by merged, partial, next, later, and deferred work. |
| [DECISIONS_LOG.md](./DECISIONS_LOG.md) | Short record of decisions that should not be rediscovered from chat history. |
| [TECH_DEBT.md](./TECH_DEBT.md) | Real debt, gaps, and known risks worth keeping visible. |
| [FEATURE_STATUS.md](./FEATURE_STATUS.md) | Feature-by-feature status using honest labels. |
| [SDD_WORKFLOW.md](./SDD_WORKFLOW.md) | How future work should move from current state to spec, plan, implementation, validation, and documentation. |
| [../AGENTS.md](../AGENTS.md) | Hard rules for coding agents working in this repo. |
| [../PLANS.md](../PLANS.md) | Reusable structure for long-running plans. |
| [../tests/README.md](../tests/README.md) | Test-artifact entry point for manual smoke checks and future automated validation assets. |

## Feature-Level Reference Docs

| Document | What it supports |
| --- | --- |
| [auth-base-mvp2.md](./auth-base-mvp2.md) | Auth base scope, chosen provider, and deferred auth phases. |
| [card-public-v2-data-mapping.md](./card-public-v2-data-mapping.md) | Public teaser card mapping to current runtime fields and gaps. |
| [card-public-v2-fallback-rules.md](./card-public-v2-fallback-rules.md) | Public card validity and fallback behavior. |
| [catalog-fallback-public-contract-audit.md](./catalog-fallback-public-contract-audit.md) | Audit of fallback data shape, normalization, and runtime aliases. |
| [detail-view-mvp2-structure.md](./detail-view-mvp2-structure.md) | Current detail structure across the two active surfaces. |
| [detail-view-mvp2-data-mapping.md](./detail-view-mvp2-data-mapping.md) | Detail mapping to the current runtime shape. |
| [detail-view-mvp2-fallback-rules.md](./detail-view-mvp2-fallback-rules.md) | Detail visibility and fallback rules. |
| [detail-view-mvp2-subtask-35-closure-justification.md](./detail-view-mvp2-subtask-35-closure-justification.md) | Closure note for the title-first identity order accepted for `NENSGO-35`. |
| [activity-contact-options-readiness-note.md](./activity-contact-options-readiness-note.md) | Readiness note for the real contact-options data source, documenting the current gap between implemented CTA behavior and available contact-option rows. |
| [pvi-supabase-readiness-note.md](./pvi-supabase-readiness-note.md) | Current PVI blocker, deferred local-fallback decision, and reopen conditions. |
| [supabase-schema-preview-2026-04-20.md](./supabase-schema-preview-2026-04-20.md) | External Supabase schema snapshot shared for planning, including tables, columns, relationships, and current unknowns. |
| [real-db-auth-migration-sdd.md](./real-db-auth-migration-sdd.md) | SDD for moving from local fallback truth to real Supabase-backed catalog/user flows and expanding auth to Google plus classic sign-up. |
| [real-db-auth-migration-open-decisions.md](./real-db-auth-migration-open-decisions.md) | Review sheet of unresolved product and technical decisions for the real DB and auth migration. |
| [real-db-auth-migration-closed-decisions.md](./real-db-auth-migration-closed-decisions.md) | Closed product and architecture decisions that answer the migration decision sheet and unblock implementation planning. |
| [real-db-auth-migration-runbook.md](./real-db-auth-migration-runbook.md) | Ops runbook for applying Supabase SQL, configuring auth, setting Vercel env vars, and validating the migration. |
| [../tests/manual/real-db-auth-preview-smoke.md](../tests/manual/real-db-auth-preview-smoke.md) | Manual smoke checklist for validating the real DB and auth migration in the active branch preview environment. |

## Suggested Reading By Topic

- Public catalog and card work:
  - [PROJECT_STATE.md](./PROJECT_STATE.md)
  - [FEATURE_STATUS.md](./FEATURE_STATUS.md)
  - [card-public-v2-data-mapping.md](./card-public-v2-data-mapping.md)
  - [card-public-v2-fallback-rules.md](./card-public-v2-fallback-rules.md)
  - [catalog-fallback-public-contract-audit.md](./catalog-fallback-public-contract-audit.md)
- Detail work:
  - [PROJECT_STATE.md](./PROJECT_STATE.md)
  - [ARCHITECTURE.md](./ARCHITECTURE.md)
  - [FEATURE_STATUS.md](./FEATURE_STATUS.md)
  - [detail-view-mvp2-structure.md](./detail-view-mvp2-structure.md)
  - [detail-view-mvp2-data-mapping.md](./detail-view-mvp2-data-mapping.md)
  - [detail-view-mvp2-fallback-rules.md](./detail-view-mvp2-fallback-rules.md)
  - [activity-contact-options-readiness-note.md](./activity-contact-options-readiness-note.md)
  - [detail-view-mvp2-subtask-35-closure-justification.md](./detail-view-mvp2-subtask-35-closure-justification.md)
- Auth, profile, and protected flows:
  - [PROJECT_STATE.md](./PROJECT_STATE.md)
  - [ARCHITECTURE.md](./ARCHITECTURE.md)
  - [FEATURE_STATUS.md](./FEATURE_STATUS.md)
  - [TECH_DEBT.md](./TECH_DEBT.md)
  - [auth-base-mvp2.md](./auth-base-mvp2.md)
- PVI and analytics readiness:
  - [PROJECT_STATE.md](./PROJECT_STATE.md)
  - [ARCHITECTURE.md](./ARCHITECTURE.md)
  - [FEATURE_STATUS.md](./FEATURE_STATUS.md)
  - [TECH_DEBT.md](./TECH_DEBT.md)
  - [ROADMAP_IMPLEMENTATION.md](./ROADMAP_IMPLEMENTATION.md)
  - [pvi-supabase-readiness-note.md](./pvi-supabase-readiness-note.md)
- Real DB migration and auth expansion:
  - [PROJECT_STATE.md](./PROJECT_STATE.md)
  - [ARCHITECTURE.md](./ARCHITECTURE.md)
  - [FEATURE_STATUS.md](./FEATURE_STATUS.md)
  - [TECH_DEBT.md](./TECH_DEBT.md)
  - [auth-base-mvp2.md](./auth-base-mvp2.md)
  - [catalog-fallback-public-contract-audit.md](./catalog-fallback-public-contract-audit.md)
  - [detail-view-mvp2-data-mapping.md](./detail-view-mvp2-data-mapping.md)
  - [pvi-supabase-readiness-note.md](./pvi-supabase-readiness-note.md)
  - [supabase-schema-preview-2026-04-20.md](./supabase-schema-preview-2026-04-20.md)
  - [activity-contact-options-readiness-note.md](./activity-contact-options-readiness-note.md)
  - [real-db-auth-migration-sdd.md](./real-db-auth-migration-sdd.md)
  - [real-db-auth-migration-open-decisions.md](./real-db-auth-migration-open-decisions.md)
  - [real-db-auth-migration-closed-decisions.md](./real-db-auth-migration-closed-decisions.md)
  - [real-db-auth-migration-runbook.md](./real-db-auth-migration-runbook.md)
- Long implementation work:
  - [SDD_WORKFLOW.md](./SDD_WORKFLOW.md)
  - [../PLANS.md](../PLANS.md)
  - [../AGENTS.md](../AGENTS.md)
- Manual smoke and validation:
  - [../tests/README.md](../tests/README.md)
  - [../tests/manual/real-db-auth-preview-smoke.md](../tests/manual/real-db-auth-preview-smoke.md)

## Maintenance Rules

- Update master docs when current state, architecture, feature status, roadmap priority, or technical debt changes materially.
- Keep feature-level docs focused on their specific contracts. Do not clone the same content into multiple master docs.
- Make branch context explicit in master docs when the documented baseline matters.
- If historical docs or old commit language conflict with current code in the active branch, the current code and master docs for that branch context take precedence.
