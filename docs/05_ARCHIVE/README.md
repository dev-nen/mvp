# Archive and Historical Docs

Esta carpeta contiene documentación heredada, SDDs, notas de fixes, snapshots y decisiones anteriores. Se conserva porque explica contexto técnico y de producto, pero no es el punto de entrada principal.

## Regla de lectura

Si un documento de esta carpeta contradice:

1. el código actual del branch checked out;
2. [../../README.md](../../README.md);
3. [../README.md](../README.md);
4. [../00_START/PROJECT_BRIEF.md](../00_START/PROJECT_BRIEF.md);
5. los docs técnicos actuales en [../02_TECHNICAL](../02_TECHNICAL);

entonces prevalecen el código actual y los docs nuevos.

## Qué vive aquí

| Grupo | Documentos |
| --- | --- |
| Estado/roadmap heredado | [PROJECT_STATE.md](./PROJECT_STATE.md), [ROADMAP_MASTER.md](./ROADMAP_MASTER.md), [ROADMAP_IMPLEMENTATION.md](./ROADMAP_IMPLEMENTATION.md), [FEATURE_STATUS.md](./FEATURE_STATUS.md), [TECH_DEBT.md](./TECH_DEBT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DECISIONS_LOG.md](./DECISIONS_LOG.md), [SDD_WORKFLOW.md](./SDD_WORKFLOW.md) |
| Fixes y hardening | [2026-05-14-fix-and-hardening-log.md](./2026-05-14-fix-and-hardening-log.md), [deployment-hardening-staging.md](./deployment-hardening-staging.md), [activity-contact-options-readiness-note.md](./activity-contact-options-readiness-note.md), [municipality-onboarding-i18n-note.md](./municipality-onboarding-i18n-note.md) |
| Real DB/auth | [real-db-auth-migration-sdd.md](./real-db-auth-migration-sdd.md), [real-db-auth-migration-runbook.md](./real-db-auth-migration-runbook.md), [real-db-auth-migration-open-decisions.md](./real-db-auth-migration-open-decisions.md), [real-db-auth-migration-closed-decisions.md](./real-db-auth-migration-closed-decisions.md), [runtime-real-closure-sdd.md](./runtime-real-closure-sdd.md), [runtime-real-closure-quickstart.md](./runtime-real-closure-quickstart.md), [supabase-schema-preview-2026-04-20.md](./supabase-schema-preview-2026-04-20.md) |
| Catálogo/detalle/contacto | [card-public-v2-data-mapping.md](./card-public-v2-data-mapping.md), [card-public-v2-fallback-rules.md](./card-public-v2-fallback-rules.md), [catalog-fallback-public-contract-audit.md](./catalog-fallback-public-contract-audit.md), [detail-view-mvp2-structure.md](./detail-view-mvp2-structure.md), [detail-view-mvp2-data-mapping.md](./detail-view-mvp2-data-mapping.md), [detail-view-mvp2-fallback-rules.md](./detail-view-mvp2-fallback-rules.md), [detail-view-mvp2-subtask-35-closure-justification.md](./detail-view-mvp2-subtask-35-closure-justification.md), [contact-message-personalization-sdd.md](./contact-message-personalization-sdd.md) |
| Draft Inbox / Scout | [scout-draft-inbox-product-plan.md](./scout-draft-inbox-product-plan.md), [scout-sources-strategy.md](./scout-sources-strategy.md), [scout-draft-inbox-phase1-sdd.md](./scout-draft-inbox-phase1-sdd.md), [approved-activity-lifecycle-phase2-sdd.md](./approved-activity-lifecycle-phase2-sdd.md), [scout-draft-inbox-viability-assessment.md](./scout-draft-inbox-viability-assessment.md) |
| Otros históricos | [2026-04-22-cross-branch-state-assessment.md](./2026-04-22-cross-branch-state-assessment.md), [auth-base-mvp2.md](./auth-base-mvp2.md), [public-frontend-vnext-sdd.md](./public-frontend-vnext-sdd.md), [public-surface-hardening-sdd.md](./public-surface-hardening-sdd.md), [pvi-supabase-readiness-note.md](./pvi-supabase-readiness-note.md), [mostrar-a-PO-runtime-real-closure-query-brief.md](./mostrar-a-PO-runtime-real-closure-query-brief.md), [DOCS_INDEX.md](./DOCS_INDEX.md) |

## Indicadores de doc histórico

Leer con cuidado si un documento:

- referencia una rama antigua;
- dice que favoritos viven en almacenamiento local del navegador;
- dice que el catálogo tiene mocks como verdad principal;
- dice que auth o i18n no existen;
- describe SEO de staging antes de sitemap/robots/canonical actuales;
- predice tareas que ya fueron absorbidas o reemplazadas.

## Para IA revisora

No empieces por esta carpeta. Empieza por [../README.md](../README.md) y sólo vuelve aquí si necesitas entender historia, decisiones absorbidas o el porqué de una deuda.
