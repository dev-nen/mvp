# Documentación de NensGo

Este es el punto de entrada único para entender el repositorio. La documentación separa estado actual, producto, arquitectura, operaciones, decisiones y referencias históricas.

NensGo es una app React/Vite/Supabase para descubrir actividades infantiles y familiares. El estado actual es MVP/validación: hay funcionalidad real implementada, pero algunas piezas dependen de configuración externa y smoke tests live antes de tratarse como cerradas.

La raíz de `docs/` se mantiene limpia: este `README.md` y subcarpetas numeradas. La documentación antigua o de contexto vive en `05_ARCHIVE`.

## Cómo leer esta documentación

| Documento | Para quién | Cuándo leerlo |
| --- | --- | --- |
| [00_START/PROJECT_BRIEF.md](./00_START/PROJECT_BRIEF.md) | CTO, PO, IA revisora | Primera lectura de negocio, alcance y riesgos |
| [01_PRODUCT/PRODUCT_OVERVIEW.md](./01_PRODUCT/PRODUCT_OVERVIEW.md) | PO, diseño, negocio | Entender concepto, usuarios y alcance MVP |
| [01_PRODUCT/USER_FLOWS.md](./01_PRODUCT/USER_FLOWS.md) | PO, QA, producto | Revisar flujos de usuario esperados |
| [01_PRODUCT/ROADMAP.md](./01_PRODUCT/ROADMAP.md) | PO, liderazgo técnico | Separar ahora, siguiente, luego y diferido |
| [02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md](./02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md) | CTO, tech lead, DevOps | Documento principal para revisión técnica externa |
| [02_TECHNICAL/TECHNICAL_OVERVIEW.md](./02_TECHNICAL/TECHNICAL_OVERVIEW.md) | PO, tech lead | Resumen técnico compartible |
| [02_TECHNICAL/ARCHITECTURE.md](./02_TECHNICAL/ARCHITECTURE.md) | Ingeniería | Arquitectura y flujos principales |
| [02_TECHNICAL/STACK_AND_DEPENDENCIES.md](./02_TECHNICAL/STACK_AND_DEPENDENCIES.md) | Ingeniería, DevOps | Stack, comandos, env vars y dependencias |
| [02_TECHNICAL/ROUTES.md](./02_TECHNICAL/ROUTES.md) | Ingeniería, QA | Rutas públicas, protegidas e internas |
| [02_TECHNICAL/FRONTEND_STRUCTURE.md](./02_TECHNICAL/FRONTEND_STRUCTURE.md) | Developers | Mapa de carpetas frontend |
| [02_TECHNICAL/SUPABASE_MODEL.md](./02_TECHNICAL/SUPABASE_MODEL.md) | Backend, DevOps, seguridad | Tablas, vistas, RPCs y expectativas de acceso |
| [02_TECHNICAL/AUTH_AND_ONBOARDING.md](./02_TECHNICAL/AUTH_AND_ONBOARDING.md) | Ingeniería, producto | Auth, perfil y onboarding por municipio |
| [02_TECHNICAL/I18N.md](./02_TECHNICAL/I18N.md) | Producto, frontend | Alcance ES/CA/EN y reglas de traducción |
| [02_TECHNICAL/SEO_AND_PUBLIC_ROUTES.md](./02_TECHNICAL/SEO_AND_PUBLIC_ROUTES.md) | SEO, frontend, producto | Canonicals, sitemap, robots y rutas públicas |
| [02_TECHNICAL/SECURITY_AND_PRIVACY.md](./02_TECHNICAL/SECURITY_AND_PRIVACY.md) | Seguridad, DevOps, CTO | RLS, privacidad, secretos y validaciones pendientes |
| [02_TECHNICAL/DEPLOYMENT_AND_ENV.md](./02_TECHNICAL/DEPLOYMENT_AND_ENV.md) | DevOps | Entornos, Vercel, Supabase y variables |
| [03_OPERATIONS/LOCAL_SETUP.md](./03_OPERATIONS/LOCAL_SETUP.md) | Developers | Cómo correr el repo localmente |
| [03_OPERATIONS/AI_WORKFLOW.md](./03_OPERATIONS/AI_WORKFLOW.md) | PO, IA, developers | Contrato operativo para clasificar tareas y escalar ceremonia por riesgo |
| [03_OPERATIONS/DISKETNEN_TEMPLATES.md](./03_OPERATIONS/DISKETNEN_TEMPLATES.md) | PO, IA, developers | Plantillas reutilizables para discovery, implementacion, review y fix packs |
| [03_OPERATIONS/VALIDATION_CHECKLIST.md](./03_OPERATIONS/VALIDATION_CHECKLIST.md) | QA, tech lead | Checks locales, manuales y live |
| [03_OPERATIONS/RELEASE_CHECKLIST.md](./03_OPERATIONS/RELEASE_CHECKLIST.md) | DevOps, tech lead | Orden de despliegue y pre-release |
| [03_OPERATIONS/ROLLOUT_NOTES.md](./03_OPERATIONS/ROLLOUT_NOTES.md) | DevOps, PO | Notas de rollout y validación posterior |
| [04_DECISIONS/ADR_INDEX.md](./04_DECISIONS/ADR_INDEX.md) | Ingeniería | Decisiones arquitectónicas resumidas |
| [05_ARCHIVE/README.md](./05_ARCHIVE/README.md) | Revisores | Cómo leer docs históricas o SDD antiguas |

## Rutas de lectura recomendadas

### Líder técnico / CTO

1. [00_START/PROJECT_BRIEF.md](./00_START/PROJECT_BRIEF.md)
2. [02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md](./02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md)
3. [02_TECHNICAL/ARCHITECTURE.md](./02_TECHNICAL/ARCHITECTURE.md)
4. [02_TECHNICAL/SUPABASE_MODEL.md](./02_TECHNICAL/SUPABASE_MODEL.md)
5. [02_TECHNICAL/SECURITY_AND_PRIVACY.md](./02_TECHNICAL/SECURITY_AND_PRIVACY.md)
6. [02_TECHNICAL/DEPLOYMENT_AND_ENV.md](./02_TECHNICAL/DEPLOYMENT_AND_ENV.md)
7. [03_OPERATIONS/VALIDATION_CHECKLIST.md](./03_OPERATIONS/VALIDATION_CHECKLIST.md)

### PO / producto

1. [00_START/PROJECT_BRIEF.md](./00_START/PROJECT_BRIEF.md)
2. [01_PRODUCT/PRODUCT_OVERVIEW.md](./01_PRODUCT/PRODUCT_OVERVIEW.md)
3. [01_PRODUCT/USER_FLOWS.md](./01_PRODUCT/USER_FLOWS.md)
4. [01_PRODUCT/ROADMAP.md](./01_PRODUCT/ROADMAP.md)
5. [02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md](./02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md)

### Onboarding de developer

1. [03_OPERATIONS/LOCAL_SETUP.md](./03_OPERATIONS/LOCAL_SETUP.md)
2. [02_TECHNICAL/STACK_AND_DEPENDENCIES.md](./02_TECHNICAL/STACK_AND_DEPENDENCIES.md)
3. [02_TECHNICAL/FRONTEND_STRUCTURE.md](./02_TECHNICAL/FRONTEND_STRUCTURE.md)
4. [02_TECHNICAL/ROUTES.md](./02_TECHNICAL/ROUTES.md)
5. [02_TECHNICAL/SUPABASE_MODEL.md](./02_TECHNICAL/SUPABASE_MODEL.md)

### Revisión asistida por IA

Si vas a pedirle a una IA que analice este repositorio, indícale que empiece por:

1. `README.md`
2. `docs/README.md`
3. `docs/00_START/PROJECT_BRIEF.md`
4. `docs/02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md`
5. `docs/02_TECHNICAL/ARCHITECTURE.md`
6. `docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`
7. `docs/03_OPERATIONS/AI_WORKFLOW.md`

La documentación distingue estado actual, decisiones, deuda técnica y próximos pasos. La app está en fase MVP/validación; no asumir que todas las piezas internas están productizadas o validadas en vivo.

## Estado de los docs anteriores

`docs/05_ARCHIVE/DOCS_INDEX.md` se mantiene como índice heredado/redirect de compatibilidad. La entrada canónica nueva es este archivo.

Los documentos antiguos de SDD, migraciones y notas de feature siguen en `docs/` porque preservan contexto útil. Si contradicen el estado actual documentado aquí o en los docs técnicos nuevos, deben leerse como históricos.

Referencias maestras heredadas aún útiles:

- [PROJECT_STATE.md](./05_ARCHIVE/PROJECT_STATE.md)
- [ARCHITECTURE.md](./05_ARCHIVE/ARCHITECTURE.md)
- [FEATURE_STATUS.md](./05_ARCHIVE/FEATURE_STATUS.md)
- [TECH_DEBT.md](./05_ARCHIVE/TECH_DEBT.md)
- [ROADMAP_MASTER.md](./05_ARCHIVE/ROADMAP_MASTER.md)
- [ROADMAP_IMPLEMENTATION.md](./05_ARCHIVE/ROADMAP_IMPLEMENTATION.md)
- [DECISIONS_LOG.md](./05_ARCHIVE/DECISIONS_LOG.md)

Docs de referencia histórica o feature-level:

- [auth-base-mvp2.md](./05_ARCHIVE/auth-base-mvp2.md)
- [real-db-auth-migration-sdd.md](./05_ARCHIVE/real-db-auth-migration-sdd.md)
- [real-db-auth-migration-runbook.md](./05_ARCHIVE/real-db-auth-migration-runbook.md)
- [runtime-real-closure-sdd.md](./05_ARCHIVE/runtime-real-closure-sdd.md)
- [municipality-onboarding-i18n-note.md](./05_ARCHIVE/municipality-onboarding-i18n-note.md)
- [2026-05-14-fix-and-hardening-log.md](./05_ARCHIVE/2026-05-14-fix-and-hardening-log.md)
- [scout-draft-inbox-product-plan.md](./05_ARCHIVE/scout-draft-inbox-product-plan.md)
- [scout-draft-inbox-phase1-sdd.md](./05_ARCHIVE/scout-draft-inbox-phase1-sdd.md)
- [approved-activity-lifecycle-phase2-sdd.md](./05_ARCHIVE/approved-activity-lifecycle-phase2-sdd.md)
- [activity-contact-options-readiness-note.md](./05_ARCHIVE/activity-contact-options-readiness-note.md)
- [deployment-hardening-staging.md](./05_ARCHIVE/deployment-hardening-staging.md)

## Referencia heredada completa

Estos documentos siguen linkados para evitar piezas huérfanas. Leerlos como contexto histórico o de feature, no como sustituto del estado actual si hay conflicto.

- [2026-04-22-cross-branch-state-assessment.md](./05_ARCHIVE/2026-04-22-cross-branch-state-assessment.md)
- [2026-05-14-fix-and-hardening-log.md](./05_ARCHIVE/2026-05-14-fix-and-hardening-log.md)
- [activity-contact-options-readiness-note.md](./05_ARCHIVE/activity-contact-options-readiness-note.md)
- [approved-activity-lifecycle-phase2-sdd.md](./05_ARCHIVE/approved-activity-lifecycle-phase2-sdd.md)
- [auth-base-mvp2.md](./05_ARCHIVE/auth-base-mvp2.md)
- [card-public-v2-data-mapping.md](./05_ARCHIVE/card-public-v2-data-mapping.md)
- [card-public-v2-fallback-rules.md](./05_ARCHIVE/card-public-v2-fallback-rules.md)
- [catalog-fallback-public-contract-audit.md](./05_ARCHIVE/catalog-fallback-public-contract-audit.md)
- [contact-message-personalization-sdd.md](./05_ARCHIVE/contact-message-personalization-sdd.md)
- [deployment-hardening-staging.md](./05_ARCHIVE/deployment-hardening-staging.md)
- [detail-view-mvp2-data-mapping.md](./05_ARCHIVE/detail-view-mvp2-data-mapping.md)
- [detail-view-mvp2-fallback-rules.md](./05_ARCHIVE/detail-view-mvp2-fallback-rules.md)
- [detail-view-mvp2-structure.md](./05_ARCHIVE/detail-view-mvp2-structure.md)
- [detail-view-mvp2-subtask-35-closure-justification.md](./05_ARCHIVE/detail-view-mvp2-subtask-35-closure-justification.md)
- [mostrar-a-PO-runtime-real-closure-query-brief.md](./05_ARCHIVE/mostrar-a-PO-runtime-real-closure-query-brief.md)
- [municipality-onboarding-i18n-note.md](./05_ARCHIVE/municipality-onboarding-i18n-note.md)
- [public-frontend-vnext-sdd.md](./05_ARCHIVE/public-frontend-vnext-sdd.md)
- [public-surface-hardening-sdd.md](./05_ARCHIVE/public-surface-hardening-sdd.md)
- [pvi-supabase-readiness-note.md](./05_ARCHIVE/pvi-supabase-readiness-note.md)
- [real-db-auth-migration-closed-decisions.md](./05_ARCHIVE/real-db-auth-migration-closed-decisions.md)
- [real-db-auth-migration-open-decisions.md](./05_ARCHIVE/real-db-auth-migration-open-decisions.md)
- [real-db-auth-migration-runbook.md](./05_ARCHIVE/real-db-auth-migration-runbook.md)
- [real-db-auth-migration-sdd.md](./05_ARCHIVE/real-db-auth-migration-sdd.md)
- [runtime-real-closure-quickstart.md](./05_ARCHIVE/runtime-real-closure-quickstart.md)
- [runtime-real-closure-sdd.md](./05_ARCHIVE/runtime-real-closure-sdd.md)
- [scout-draft-inbox-phase1-sdd.md](./05_ARCHIVE/scout-draft-inbox-phase1-sdd.md)
- [scout-draft-inbox-product-plan.md](./05_ARCHIVE/scout-draft-inbox-product-plan.md)
- [scout-draft-inbox-viability-assessment.md](./05_ARCHIVE/scout-draft-inbox-viability-assessment.md)
- [scout-sources-strategy.md](./05_ARCHIVE/scout-sources-strategy.md)
- [SDD_WORKFLOW.md](./05_ARCHIVE/SDD_WORKFLOW.md)
- [supabase-schema-preview-2026-04-20.md](./05_ARCHIVE/supabase-schema-preview-2026-04-20.md)

## Mantenimiento

- Actualizar este índice cuando se cree, mueva o retire documentación.
- No duplicar una explicación técnica larga si ya existe un doc especializado.
- Usar los estados `Done`, `In progress`, `Partial`, `Planned` y `Blocked` con precisión.
- No documentar como cerrado algo que dependa de Supabase, Vercel, OAuth o smoke tests live sin evidencia.
