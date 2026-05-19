# Routes

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
- Internal routes keep using `InternalToolRoute` and existing
  `internal_tool_access` checks.

## Notas

- La protección frontend no reemplaza RLS ni checks de backend.
- `/api/internal/pvi` no debe exponerse como dashboard público.
- `robots.txt` bloquea rutas protegidas e internas, pero la seguridad real depende de auth/RLS/API.
