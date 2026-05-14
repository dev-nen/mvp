# Technical Overview

## Resumen

NensGo es una SPA React/Vite con Supabase como backend de producto. Vercel aloja el frontend, ejecuta la función interna `/api/internal/pvi` y recoge Web Analytics.

Estado técnico actual: `Partial`. La implementación está en repo, pero parte de la fiabilidad depende de configuración externa y validación live.

## Stack

- JavaScript.
- React 18.
- Vite 6.
- React Router.
- Supabase JS.
- Supabase Auth.
- Supabase Postgres.
- Vercel hosting/functions/analytics.
- CSS plano.

## Runtime architecture

- Browser SPA para UI, auth client y lecturas/escrituras públicas/autenticadas.
- Supabase para identidad, perfiles, catálogo, favoritos, contacto, eventos y herramientas internas.
- Vercel para servir `dist`, reescribir rutas SPA y ejecutar API server-side.
- `@vercel/analytics` montado una vez en `src/App.jsx`.

## Data flow

| Flujo | Fuente |
| --- | --- |
| Catálogo | `catalog_activities_read` |
| Municipios | `municipality_choices_read`, fallback `cities` |
| Perfil | `user_profiles` + `ensure_my_profile` |
| Favoritos | `user_favorite_activities` |
| Contacto | `activity_contact_options_read` |
| Eventos | `activity_view_events`, `activity_contact_events` |
| Draft Inbox | `activity_drafts`, `internal_tool_access`, RPCs internas |

## Environment variables

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`: disponibles en cliente.
- `SUPABASE_SERVICE_ROLE_KEY` e `INTERNAL_PVI_API_TOKEN`: sólo servidor/Vercel.

## Local development

```powershell
npm install
npm.cmd run dev
```

PowerShell puede bloquear `npm` por política de ejecución; usar `npm.cmd` evita ese problema.

## Commands

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Scripts relevantes:

- `check:static`
- `check:contracts`
- `check:contact-message`
- `gate2:check`
- `gate3:audit`
- `gate4:prep`
- `gate4:metrics`
- `gate5:prep`
- `gate6:prep`

## Folder map

| Carpeta | Uso |
| --- | --- |
| `src/pages` | Páginas públicas, protegidas e internas |
| `src/components` | Componentes compartidos |
| `src/context` | Auth context |
| `src/hooks` | Hooks de catálogo, favoritos, auth y contacto |
| `src/services` | Acceso a Supabase y servicios de dominio |
| `src/i18n` | Diccionarios y provider ES/CA/EN |
| `api/internal` | Función server-side privada |
| `supabase/sql` | SQL versionado |
| `supabase/manual` | Operaciones manuales de validación/aplicación |
| `tests/manual` | Smoke tests manuales |
| `docs` | Documentación del repo |

## Known technical caveats

- Vite puede avisar de chunk principal mayor de 500 kB.
- No hay suite formal de unit tests/lint.
- El detalle está dividido entre modal Home y ruta Favoritos.
- Draft Inbox requiere validación live y permisos reales.
- `activity_contact_options_read` requiere datos completos para validar todos los estados.
- El modelo de Les Roquetes es temporal.
