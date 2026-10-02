# Routes

## Rutas vigentes de mantenimiento

Contrato local de `src/App.jsx` en `feat/publisher-request-flow-phase4`.
Estado de rollout: **Partial**, con despliegue y smoke externo pendientes.

| Ruta | Acceso y comportamiento |
| --- | --- |
| `/` | Pública: catálogo, categorías y detalle modal sin sesión. |
| `/sobre-nensgo` | Pública: Conócenos como presentación del proyecto. |
| `/privacidad`, `/terminos` | Públicas: textos adaptados a mantenimiento. |
| `/para-centros` | Redirige a `/sobre-nensgo`; no landing ni alta de centros. |
| `/usuario` | Login privado, sin enlace público; noindex. |
| `/internal` | Redirige a `/internal/drafts`. |
| `/internal/import` | Operadores permitidos: JSON, preview y guardar borradores. |
| `/internal/drafts`, `/internal/drafts/new`, `/internal/drafts/:draftId` | Operadores permitidos: inbox, alta manual y revisión/publicación. |
| `/internal/activities`, `/internal/activities/:activityId` | Operadores permitidos: catálogo y lifecycle de actividades aprobadas. |
| `POST /api/internal/catalog-backup` | Sesión y permiso en servidor; sólo dominio/entorno de producción. |
| `/api/internal/pvi` | Retirada; responde 410. |
| Rutas de perfil/favoritos/centros retiradas y desconocidas | Redirigen a `/`; no montan sus páginas anteriores. |

No se añade una ruta pública de cuenta ni una ruta nueva para el detalle: éste
sigue en el modal de catálogo. La selección de contactos y el nombre temporal
no requieren sesión. `robots.txt` excluye las rutas privadas y el sitemap
contiene sólo las páginas públicas vigentes.
Ver [runbook](../03_OPERATIONS/MAINTENANCE_RUNBOOK.md).

El índice siguiente es **histórico**. Sus rutas protegidas y de publisher no
deben interpretarse como activas después de esta transición.

## Referencia anterior (histórica)

## Route index


| Route | Tipo | SEO | Estado | Notes |
| --- | --- | --- | --- | --- |
| `/` | Pública | Indexable | Partial | Landing + catálogo público desde Supabase. |
| `/sobre-nensgo` | Pública | Indexable | Partial | Página de explicación de NensGo. |
| `/para-centros` | Pública | Indexable | Partial | Landing B2B/preparación para centros. |
| `/privacidad` | Pública | Indexable | Partial | Trust/legal page para privacidad. |
| `/terminos` | Pública | Indexable | Partial | Trust/legal page para términos. |
| `/perfil` | Protegida | Bloqueada por robots | Partial | Perfil app; requiere auth y onboarding. |
| `/perfil/publicaciones` | Protegida | Bloqueada por robots | Partial | Inbox de publicaciones propias; solo datos sanitizados del usuario autenticado. |
| `/perfil/publicaciones/nueva` | Protegida | Bloqueada por robots | Partial | Phase 3 MVP para enviar una actividad nueva como `activity_draft`; no publica directo. |
| `/perfil/publicaciones/:draftId/corregir` | Protegida | Bloqueada por robots | Partial | Correccion de draft propio en `needs_changes`; crea nueva version al enviar. |
| `/perfil/publicaciones/actividad/:activityId/editar` | Protegida | Bloqueada por robots | Partial | Solicitud de edicion de actividad propia; despublica y crea draft pendiente. |
| `/favoritos` | Protegida | Bloqueada por robots | Partial | Favoritos remotos. |
| `/favoritos/:activityId` | Protegida | Bloqueada por robots | Partial | Detalle desde favoritos. |
| `/soporte` | Pública placeholder | Bloqueada por robots | Planned | Placeholder, no soporte real cerrado. |
| `/internal/drafts` | Interna | Bloqueada por robots | Partial | Draft Inbox list. |
| `/internal/drafts/new` | Interna | Bloqueada por robots | Partial | Alta manual interna de actividad como `activity_draft`; no publica directo. |
| `/internal/drafts/:draftId` | Interna | Bloqueada por robots | Partial | Draft detail/review. |
| `/internal/activities` | Interna | Bloqueada por robots | Partial | Catálogo interno de actividades publicadas/despublicadas con toggle seguro por RPC; smoke live OK para usuario interno autorizado. |
| `/internal/activities/:activityId` | Interna | Bloqueada por robots | Partial | Edit/unpublish/republish interno. |
| `/api/internal/pvi` | API interna | Noindex headers | Partial | Reporting interno con bearer token. |

## Pública vs protegida vs interna

- Pública: puede renderizar sin sesión.
- Protegida: requiere sesión Supabase, email verificado y perfil app mínimo.
- Interna: añade autorización por `internal_tool_access`.

## Phase 2 Core route rules

- `/perfil/publicaciones` and child routes use `ProtectedRoute`, not
  `InternalToolRoute`.
- User publication routes must call sanitized owner-checking RPCs only.
- User routes must not expose `review_notes`, `internal_review_notes`, raw
  Supabase UUIDs, direct publish/republish controls, or other users' records.
- `/perfil/publicaciones/nueva` calls `create_my_activity_submission` and
  creates only `activity_drafts` with `source_type = 'user_submission'`.
- Phase 4 allows contact options inside the draft payload on user publication
  routes, but still does not allow direct normal-user writes to live
  `activity_contact_options`.
- Phase 3/4 do not add `/sugerir-actividad`, anonymous submissions, center
  creation, or normal-user image upload.
- Internal routes keep using `InternalToolRoute` and existing
  `internal_tool_access` checks.

## Contact route behavior

- No new public route is added for contact options.
- Public detail still reads contacts through `activity_contact_options_read`.
- The public CTA label remains `Contactar` for one or many contact options.
- One option opens directly; multiple options open the chooser/modal.

## Notas

- La protección frontend no reemplaza RLS ni checks de backend.
- `/api/internal/pvi` no debe exponerse como dashboard público.
- `robots.txt` bloquea rutas protegidas e internas, pero la seguridad real depende de auth/RLS/API.
