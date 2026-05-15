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
| `/favoritos` | Protegida | Bloqueada por robots | Partial | Favoritos remotos. |
| `/favoritos/:activityId` | Protegida | Bloqueada por robots | Partial | Detalle desde favoritos. |
| `/soporte` | Pública placeholder | Bloqueada por robots | Planned | Placeholder, no soporte real cerrado. |
| `/internal/drafts` | Interna | Bloqueada por robots | Partial | Draft Inbox list. |
| `/internal/drafts/new` | Interna | Bloqueada por robots | Partial | Alta manual interna de actividad como `activity_draft`; no publica directo. |
| `/internal/drafts/:draftId` | Interna | Bloqueada por robots | Partial | Draft detail/review. |
| `/internal/activities/:activityId` | Interna | Bloqueada por robots | Partial | Edit/unpublish/republish interno. |
| `/api/internal/pvi` | API interna | Noindex headers | Partial | Reporting interno con bearer token. |

## Pública vs protegida vs interna

- Pública: puede renderizar sin sesión.
- Protegida: requiere sesión Supabase, email verificado y perfil app mínimo.
- Interna: añade autorización por `internal_tool_access`.

## Notas

- La protección frontend no reemplaza RLS ni checks de backend.
- `/api/internal/pvi` no debe exponerse como dashboard público.
- `robots.txt` bloquea rutas protegidas e internas, pero la seguridad real depende de auth/RLS/API.
