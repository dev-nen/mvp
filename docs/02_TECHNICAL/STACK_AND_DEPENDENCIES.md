# Stack and Dependencies

## Lenguaje y framework

- JavaScript ESM.
- React 18.3.
- Vite 6.3.

## Dependencias principales

| Paquete | Uso |
| --- | --- |
| `@supabase/supabase-js` | Auth, DB, RPC y cliente browser/server |
| `@vercel/analytics` | Web Analytics |
| `lucide-react` | Iconos UI |
| `react` / `react-dom` | UI |
| `react-router-dom` | Routing SPA |

## Dev dependencies

| Paquete | Uso |
| --- | --- |
| `@vitejs/plugin-react` | Plugin React para Vite |
| `vite` | Dev server y build |

## Hosting

Vercel está configurado mediante `vercel.json`:

- framework: Vite.
- build command: `npm run build`.
- output: `dist`.
- rewrites para `/api/*` y fallback SPA a `index.html`.

## Backend

Supabase:

- Auth.
- Postgres.
- Vistas públicas.
- Tablas protegidas por RLS.
- RPCs para perfil, reporting e internal tools.

## Storage

El código puede construir URLs públicas para el bucket `activities` mediante `buildSupabasePublicStorageUrl`. No asumir que hay un flujo de subida productizado en este repo.

## Analytics

- Vercel Web Analytics para tráfico de rutas.
- Supabase event tables para vistas/contactos de actividad.
- `/api/internal/pvi` para lectura server-side interna.

## Commands

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run check
npm.cmd run preview
```

## Env vars

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

## Current known warnings

- El build puede mostrar warning de chunk principal por encima de 500 kB.
- No hay lint/test unitario formal en `package.json`.
